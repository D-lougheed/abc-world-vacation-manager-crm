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
  X,
  SlidersHorizontal,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { RangeSlider } from "@/components/ui/range-slider";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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

interface Filters {
  client: string | null;
  vendor: string | null; 
  agent: string | null;
  startDate: Date | null;
  endDate: Date | null;
  bookingStatus: BookingStatus | null;
  commissionStatus: CommissionStatus | null;
  minCommission: number;
  maxCommission: number;
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    client: null,
    vendor: null,
    agent: null,
    startDate: null,
    endDate: null,
    bookingStatus: null,
    commissionStatus: null,
    minCommission: 0,
    maxCommission: 10000,
  });
  const [uniqueClients, setUniqueClients] = useState<string[]>([]);
  const [uniqueVendors, setUniqueVendors] = useState<string[]>([]);
  const [uniqueAgents, setUniqueAgents] = useState<string[]>([]);
  const [maxPossibleCommission, setMaxPossibleCommission] = useState(10000);

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

        // Extract unique client, vendor, agent names
        const clients = [...new Set(processedBookings.map(b => b.client))];
        const vendors = [...new Set(processedBookings.map(b => b.vendor))];
        const agents = [...new Set(processedBookings.map(b => b.agent))];
        setUniqueClients(clients);
        setUniqueVendors(vendors);
        setUniqueAgents(agents);

        // Find max commission amount
        const maxCommission = Math.max(...processedBookings.map(b => b.commissionAmount), 10000);
        setMaxPossibleCommission(maxCommission);
        setFilters(prev => ({...prev, maxCommission: maxCommission}));
        
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

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      client: null,
      vendor: null,
      agent: null,
      startDate: null,
      endDate: null,
      bookingStatus: null,
      commissionStatus: null,
      minCommission: 0,
      maxCommission: maxPossibleCommission,
    });
    setSearchTerm("");
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.client) count++;
    if (filters.vendor) count++;
    if (filters.agent) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.bookingStatus) count++;
    if (filters.commissionStatus) count++;
    if (filters.minCommission > 0 || filters.maxCommission < maxPossibleCommission) count++;
    return count;
  };

  // Filter bookings based on search term and filters
  const filteredBookings = bookings.filter((booking) => {
    // Search term filter
    const client = booking.client.toLowerCase();
    const vendor = booking.vendor.toLowerCase();
    const agent = booking.agent.toLowerCase();
    const searchString = searchTerm.toLowerCase();
    
    const matchesSearch = 
      client.includes(searchString) ||
      vendor.includes(searchString) ||
      agent.includes(searchString);
    
    // Apply specific filters
    const matchesClient = !filters.client || booking.client === filters.client;
    const matchesVendor = !filters.vendor || booking.vendor === filters.vendor;
    const matchesAgent = !filters.agent || booking.agent === filters.agent;
    
    // Date range filter
    const bookingDate = new Date(booking.date);
    const matchesStartDate = !filters.startDate || bookingDate >= filters.startDate;
    const matchesEndDate = !filters.endDate || bookingDate <= filters.endDate;
    
    // Status filters
    const matchesBookingStatus = !filters.bookingStatus || booking.bookingStatus === filters.bookingStatus;
    const matchesCommissionStatus = !filters.commissionStatus || booking.commissionStatus === filters.commissionStatus;
    
    // Commission amount filter
    const matchesCommissionAmount = 
      booking.commissionAmount >= filters.minCommission && 
      booking.commissionAmount <= filters.maxCommission;
    
    return matchesSearch && 
           matchesClient && 
           matchesVendor && 
           matchesAgent && 
           matchesStartDate && 
           matchesEndDate && 
           matchesBookingStatus && 
           matchesCommissionStatus && 
           matchesCommissionAmount;
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
                <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 md:flex-initial">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {getActiveFilterCount() > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {getActiveFilterCount()}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 md:w-96 p-4" align="start" side="bottom">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Filters</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                          onClick={clearAllFilters}
                        >
                          Clear all
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Client</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              {filters.client || "Select Client"}
                              <SlidersHorizontal className="ml-auto h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Clients</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              {uniqueClients.map(client => (
                                <DropdownMenuCheckboxItem
                                  key={client}
                                  checked={filters.client === client}
                                  onCheckedChange={() => 
                                    handleFilterChange('client', filters.client === client ? null : client)
                                  }
                                >
                                  {client}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Vendor</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              {filters.vendor || "Select Vendor"}
                              <SlidersHorizontal className="ml-auto h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Vendors</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              {uniqueVendors.map(vendor => (
                                <DropdownMenuCheckboxItem
                                  key={vendor}
                                  checked={filters.vendor === vendor}
                                  onCheckedChange={() => 
                                    handleFilterChange('vendor', filters.vendor === vendor ? null : vendor)
                                  }
                                >
                                  {vendor}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Agent</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              {filters.agent || "Select Agent"}
                              <SlidersHorizontal className="ml-auto h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>Agents</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              {uniqueAgents.map(agent => (
                                <DropdownMenuCheckboxItem
                                  key={agent}
                                  checked={filters.agent === agent}
                                  onCheckedChange={() => 
                                    handleFilterChange('agent', filters.agent === agent ? null : agent)
                                  }
                                >
                                  {agent}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Date Range</h4>
                        <div className="flex gap-2">
                          <div className="w-1/2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left",
                                    !filters.startDate && "text-muted-foreground"
                                  )}
                                >
                                  {filters.startDate ? format(filters.startDate, "PP") : "Start Date"}
                                  <CalendarClock className="ml-auto h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={filters.startDate || undefined}
                                  onSelect={(date) => handleFilterChange('startDate', date)}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="w-1/2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left",
                                    !filters.endDate && "text-muted-foreground"
                                  )}
                                >
                                  {filters.endDate ? format(filters.endDate, "PP") : "End Date"}
                                  <CalendarClock className="ml-auto h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={filters.endDate || undefined}
                                  onSelect={(date) => handleFilterChange('endDate', date)}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        {filters.startDate && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              handleFilterChange('startDate', null);
                              handleFilterChange('endDate', null);
                            }}
                          >
                            <X className="h-3 w-3 mr-1" /> Clear dates
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Booking Status</h4>
                        <RadioGroup 
                          value={filters.bookingStatus || ''} 
                          onValueChange={(value) => 
                            handleFilterChange('bookingStatus', value || null)
                          }
                          className="flex flex-wrap gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Confirmed" id="confirmed" />
                            <Label htmlFor="confirmed">Confirmed</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Pending" id="pending" />
                            <Label htmlFor="pending">Pending</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Canceled" id="canceled" />
                            <Label htmlFor="canceled">Canceled</Label>
                          </div>
                          {filters.bookingStatus && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs"
                              onClick={() => handleFilterChange('bookingStatus', null)}
                            >
                              <X className="h-3 w-3 mr-1" /> Clear
                            </Button>
                          )}
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Commission Status</h4>
                        <RadioGroup 
                          value={filters.commissionStatus || ''} 
                          onValueChange={(value) => 
                            handleFilterChange('commissionStatus', value || null)
                          }
                          className="flex flex-wrap gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Received" id="received" />
                            <Label htmlFor="received">Received</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Unreceived" id="unreceived" />
                            <Label htmlFor="unreceived">Unreceived</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Completed" id="completed" />
                            <Label htmlFor="completed">Completed</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Canceled" id="commission-canceled" />
                            <Label htmlFor="commission-canceled">Canceled</Label>
                          </div>
                          {filters.commissionStatus && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs"
                              onClick={() => handleFilterChange('commissionStatus', null)}
                            >
                              <X className="h-3 w-3 mr-1" /> Clear
                            </Button>
                          )}
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Commission Amount</h4>
                          <span className="text-xs text-muted-foreground">
                            ${filters.minCommission.toLocaleString()} - ${filters.maxCommission.toLocaleString()}
                          </span>
                        </div>
                        <RangeSlider
                          defaultValue={[filters.minCommission, filters.maxCommission]}
                          max={maxPossibleCommission}
                          step={100}
                          onValueChange={([min, max]) => {
                            handleFilterChange('minCommission', min);
                            handleFilterChange('maxCommission', max);
                          }}
                          className="py-4"
                        />
                        {(filters.minCommission > 0 || filters.maxCommission < maxPossibleCommission) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              handleFilterChange('minCommission', 0);
                              handleFilterChange('maxCommission', maxPossibleCommission);
                            }}
                          >
                            <X className="h-3 w-3 mr-1" /> Reset range
                          </Button>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
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
                        {getActiveFilterCount() > 0 
                          ? "No matching bookings found. Try adjusting your filters."
                          : "No commission data found. Try a different search term."
                        }
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
