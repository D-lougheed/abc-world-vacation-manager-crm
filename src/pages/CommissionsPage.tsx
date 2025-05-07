import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter,
  CreditCard,
  CircleCheck,
  CircleX,
  CircleDashed,
  User,
  ArrowUpDown,
  CalendarClock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingStatus, CommissionStatus, UserRole } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { exportToExcel } from "@/utils/excelExport";

interface Booking {
  id: string;
  client: string;
  vendor: string;
  agent: string;
  date: string;
  bookingStatus: BookingStatus;
  commissionStatus: CommissionStatus;
  cost: number;
  commissionRate: number;
  commissionAmount: number;
}

interface CommissionSummary {
  totalBookings: number;
  totalCommission: number;
  confirmedCommission: number;
  agentCount: number;
  unreceivedCommission: number;
  receivedCommission: number;
  completedCommission: number;
}

const CommissionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary>({
    totalBookings: 0,
    totalCommission: 0,
    confirmedCommission: 0,
    agentCount: 0,
    unreceivedCommission: 0,
    receivedCommission: 0,
    completedCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch commissions data from Supabase
  useEffect(() => {
    const fetchCommissionsData = async () => {
      try {
        setLoading(true);
        
        // Fetch all bookings with commission data
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            vendor_id,
            agent_id,
            start_date,
            booking_status,
            commission_status,
            cost,
            commission_rate,
            commission_amount
          `)
          .order('start_date', { ascending: false });
        
        if (bookingsError) throw bookingsError;
        
        // Process bookings to include client, vendor and agent names
        const processedBookings = await Promise.all(bookingsData.map(async (booking) => {
          // Get client names for this booking
          const clientNames = await getClientNamesForBooking(booking.id);
          
          // Get vendor name
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('name')
            .eq('id', booking.vendor_id)
            .single();
          
          // Get agent name
          const { data: agentData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', booking.agent_id)
            .single();
          
          return {
            id: booking.id,
            client: clientNames,
            vendor: vendorData?.name || 'Unknown Vendor',
            agent: agentData ? `${agentData.first_name} ${agentData.last_name}` : 'Unknown Agent',
            date: booking.start_date,
            bookingStatus: booking.booking_status as BookingStatus,
            commissionStatus: booking.commission_status as CommissionStatus,
            cost: booking.cost,
            commissionRate: booking.commission_rate,
            commissionAmount: booking.commission_amount
          };
        }));
        
        setBookings(processedBookings);
        
        // Calculate commission summary
        // 1. Total number of bookings
        const totalBookings = bookingsData.length;
        
        // 2. Sum of all commission amounts
        const totalCommission = bookingsData.reduce((sum, booking) => sum + (booking.commission_amount || 0), 0);
        
        // 3. Sum of commission from confirmed bookings
        const confirmedCommission = bookingsData
          .filter(booking => booking.booking_status === 'Confirmed')
          .reduce((sum, booking) => sum + (booking.commission_amount || 0), 0);
        
        // 4. Count distinct agents
        const { count: agentCount, error: agentCountError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'Agent');
        
        if (agentCountError) throw agentCountError;
        
        // 5. Sum of unreceived commission
        const unreceivedCommission = bookingsData
          .filter(booking => booking.commission_status === 'Unreceived')
          .reduce((sum, booking) => sum + (booking.commission_amount || 0), 0);
        
        // 6. Sum of received commission
        const receivedCommission = bookingsData
          .filter(booking => booking.commission_status === 'Received')
          .reduce((sum, booking) => sum + (booking.commission_amount || 0), 0);
        
        // 7. Sum of completed commission
        const completedCommission = bookingsData
          .filter(booking => booking.commission_status === 'Completed')
          .reduce((sum, booking) => sum + (booking.commission_amount || 0), 0);
        
        // Set commission summary
        setCommissionSummary({
          totalBookings,
          totalCommission,
          confirmedCommission,
          agentCount: agentCount || 0,
          unreceivedCommission,
          receivedCommission,
          completedCommission
        });
        
      } catch (error: any) {
        console.error('Error fetching commissions data:', error);
        toast({
          title: "Failed to load commissions data",
          description: error.message || "There was an error loading the commissions data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCommissionsData();
  }, [toast]);

  // Helper function to get client names for a booking
  const getClientNamesForBooking = async (bookingId: string): Promise<string> => {
    try {
      const { data: bookingClientsData, error: bookingClientsError } = await supabase
        .from('booking_clients')
        .select('client_id')
        .eq('booking_id', bookingId);
      
      if (bookingClientsError) throw bookingClientsError;
      
      if (bookingClientsData.length === 0) return 'No clients';
      
      const clientIds = bookingClientsData.map(bc => bc.client_id);
      
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .in('id', clientIds);
      
      if (clientsError) throw clientsError;
      
      if (clientsData.length === 0) return 'Unknown clients';
      
      // If there are multiple clients, display first client name + "& others"
      if (clientsData.length > 1) {
        return `${clientsData[0].first_name} ${clientsData[0].last_name} & others`;
      }
      
      // If there's only one client
      return `${clientsData[0].first_name} ${clientsData[0].last_name}`;
    } catch (error) {
      console.error('Error fetching clients for booking:', error);
      return 'Error fetching clients';
    }
  };

  // Filter bookings based on search term
  const filteredBookings = bookings.filter((booking) => {
    const client = booking.client.toLowerCase();
    const vendor = booking.vendor.toLowerCase();
    const agent = booking.agent.toLowerCase();
    
    const searchString = searchTerm.toLowerCase();
    
    return (
      client.includes(searchString) ||
      vendor.includes(searchString) ||
      agent.includes(searchString)
    );
  });

  // Function to get commission status badge styling and icon
  const getCommissionStatusBadge = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.Received:
        return {
          style: "bg-green-100 text-green-800",
          icon: <CircleCheck className="h-4 w-4 mr-1" />
        };
      case CommissionStatus.Unreceived:
        return {
          style: "bg-yellow-100 text-yellow-800",
          icon: <CircleDashed className="h-4 w-4 mr-1" />
        };
      case CommissionStatus.Completed:
        return {
          style: "bg-blue-100 text-blue-800",
          icon: <CircleCheck className="h-4 w-4 mr-1" />
        };
      case CommissionStatus.Canceled:
        return {
          style: "bg-red-100 text-red-800",
          icon: <CircleX className="h-4 w-4 mr-1" />
        };
      default:
        return {
          style: "bg-gray-100 text-gray-800",
          icon: null
        };
    }
  };

  // Handle export to Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      
      // Prepare data for export
      const exportData = filteredBookings.map(booking => ({
        'Client': booking.client,
        'Vendor': booking.vendor,
        'Agent': booking.agent,
        'Date': new Date(booking.date).toLocaleDateString(),
        'Booking Status': booking.bookingStatus,
        'Commission Status': booking.commissionStatus,
        'Cost ($)': booking.cost,
        'Commission Rate (%)': booking.commissionRate,
        'Commission Amount ($)': booking.commissionAmount,
      }));

      // Generate Excel file
      exportToExcel(exportData, 'Commissions_Export');
      
      toast({
        title: "Export Successful",
        description: `${exportData.length} records exported to Excel.`,
      });
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Export Failed",
        description: error.message || "There was an error exporting the data",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Commissions</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bookings"
            value={commissionSummary.totalBookings}
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard
            title="Total Commission"
            value={`$${commissionSummary.totalCommission.toLocaleString()}`}
            icon={<CreditCard className="h-5 w-5" />}
            description="From all bookings"
          />
          <StatCard
            title="Confirmed Commission"
            value={`$${commissionSummary.confirmedCommission.toLocaleString()}`}
            icon={<CircleCheck className="h-5 w-5" />}
            description="From confirmed bookings"
          />
          <StatCard
            title="Travel Agents"
            value={commissionSummary.agentCount}
            icon={<User className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Unreceived Commission"
            value={`$${commissionSummary.unreceivedCommission.toLocaleString()}`}
            icon={<CircleDashed className="h-5 w-5" />}
            className="bg-yellow-50"
          />
          <StatCard
            title="Received Commission"
            value={`$${commissionSummary.receivedCommission.toLocaleString()}`}
            icon={<CircleCheck className="h-5 w-5" />}
            className="bg-green-50"
          />
          <StatCard
            title="Completed Commission"
            value={`$${commissionSummary.completedCommission.toLocaleString()}`}
            icon={<CircleCheck className="h-5 w-5" />}
            className="bg-blue-50"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Commission Tracking</CardTitle>
            <CardDescription>Track and manage all booking commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client, vendor or agent..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" className="flex-1 md:flex-initial">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 md:flex-initial"
                  onClick={handleExportToExcel}
                  disabled={exporting || filteredBookings.length === 0}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export to Excel'}
                </Button>
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Agent
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Booking Status</TableHead>
                    <TableHead>Commission Status</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading commission data...
                      </TableCell>
                    </TableRow>
                  ) : filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => {
                      const commissionStatus = getCommissionStatusBadge(booking.commissionStatus);
                      
                      return (
                        <TableRow 
                          key={booking.id} 
                          className="cursor-pointer hover:bg-muted/50" 
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                        >
                          <TableCell>{booking.client}</TableCell>
                          <TableCell>{booking.vendor}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.agent}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CalendarClock className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(booking.date).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              booking.bookingStatus === BookingStatus.Confirmed
                                ? "bg-green-100 text-green-800"
                                : booking.bookingStatus === BookingStatus.Pending
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }>
                              {booking.bookingStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={commissionStatus.style} variant="outline">
                              <div className="flex items-center">
                                {commissionStatus.icon}
                                <span>{booking.commissionStatus}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">${booking.cost.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium text-primary">${booking.commissionAmount.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{booking.commissionRate}%</div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No commission data found. Try a different search term.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default CommissionsPage;
