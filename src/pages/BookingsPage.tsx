import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  FilePlus2,
  Users,
  Briefcase,
  Calendar,
  Check,
  X,
  Clock,
  Loader2
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
import { BookingStatus, CommissionStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import BookingFilters, { BookingFiltersType } from "@/components/bookings/BookingFilters";

interface BookingWithDetails {
  id: string;
  clients: string[];
  vendor: string;
  trip?: string;
  serviceType: string;
  startDate: string;
  endDate: string | null;
  location: string;
  cost: number;
  commissionRate: number;
  commissionAmount: number;
  bookingStatus: BookingStatus;
  isCompleted: boolean;
  commissionStatus: CommissionStatus;
  agent: string;
}

const BookingsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<BookingFiltersType>({
    clientSearchTerm: "",
    serviceTypes: [],
    dateRange: { from: undefined, to: undefined },
    bookingStatuses: [],
    commissionStatuses: []
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch service types for filter dropdown
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('service_types')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        setServiceTypes(data || []);
      } catch (error: any) {
        console.error('Error fetching service types:', error);
        toast({
          title: "Failed to load service types",
          description: error.message || "There was an error loading service types",
          variant: "destructive"
        });
      }
    };

    fetchServiceTypes();
  }, [toast]);

  // Fetch bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        
        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*, service_type_id')
          .order('start_date', { ascending: false });
        
        if (bookingsError) throw bookingsError;
        
        // For each booking, fetch associated clients, vendor, service type, trip, and agent
        const bookingsWithDetails = await Promise.all((bookingsData || []).map(async (booking) => {
          // Fetch clients for this booking
          const { data: bookingClients, error: bookingClientsError } = await supabase
            .from('booking_clients')
            .select('client_id')
            .eq('booking_id', booking.id);
          
          if (bookingClientsError) console.error('Error fetching booking clients:', bookingClientsError);
          
          let clientNames: string[] = [];
          if (bookingClients && bookingClients.length > 0) {
            const clientIds = bookingClients.map(relation => relation.client_id);
            const { data: clientsData, error: clientsError } = await supabase
              .from('clients')
              .select('first_name, last_name')
              .in('id', clientIds);
            
            if (clientsError) console.error('Error fetching clients:', clientsError);
            clientNames = clientsData ? clientsData.map(client => `${client.first_name} ${client.last_name}`) : [];
          }
          
          // Fetch vendor name
          let vendorName = "Unknown Vendor";
          if (booking.vendor_id) {
            const { data: vendorData, error: vendorError } = await supabase
              .from('vendors')
              .select('name')
              .eq('id', booking.vendor_id)
              .single();
            
            if (vendorError) console.error('Error fetching vendor:', vendorError);
            if (vendorData) vendorName = vendorData.name;
          }
          
          // Fetch service type
          let serviceTypeName = "Unknown Service";
          if (booking.service_type_id) {
            const { data: serviceTypeData, error: serviceTypeError } = await supabase
              .from('service_types')
              .select('name')
              .eq('id', booking.service_type_id)
              .single();
            
            if (serviceTypeError) console.error('Error fetching service type:', serviceTypeError);
            if (serviceTypeData) serviceTypeName = serviceTypeData.name;
          }
          
          // Fetch trip name if exists
          let tripName: string | undefined;
          if (booking.trip_id) {
            const { data: tripData, error: tripError } = await supabase
              .from('trips')
              .select('name')
              .eq('id', booking.trip_id)
              .single();
            
            if (tripError) console.error('Error fetching trip:', tripError);
            if (tripData) tripName = tripData.name;
          }
          
          // Fetch agent name
          let agentName = "Unknown Agent";
          if (booking.agent_id) {
            const { data: agentData, error: agentError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', booking.agent_id)
              .single();
            
            if (agentError) console.error('Error fetching agent:', agentError);
            if (agentData) agentName = `${agentData.first_name} ${agentData.last_name}`;
          }
          
          return {
            id: booking.id,
            clients: clientNames,
            vendor: vendorName,
            trip: tripName,
            serviceType: serviceTypeName,
            startDate: booking.start_date,
            endDate: booking.end_date,
            location: booking.location,
            cost: booking.cost,
            commissionRate: booking.commission_rate,
            commissionAmount: booking.commission_amount,
            bookingStatus: booking.booking_status as BookingStatus,
            isCompleted: booking.is_completed,
            commissionStatus: booking.commission_status as CommissionStatus,
            agent: agentName
          };
        }));
        
        setBookings(bookingsWithDetails);
        setFilteredBookings(bookingsWithDetails);
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Failed to load bookings",
          description: error.message || "There was an error loading booking data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [toast]);

  // Search and filter bookings based on search term and filters
  useEffect(() => {
    const applyFiltersAndSearch = () => {
      let result = [...bookings];
      
      // Apply search term
      if (searchTerm.trim()) {
        const searchString = searchTerm.toLowerCase();
        result = result.filter((booking) => {
          const clientNames = booking.clients.join(" ").toLowerCase();
          const vendor = booking.vendor.toLowerCase();
          const trip = booking.trip?.toLowerCase() || "";
          const serviceType = booking.serviceType.toLowerCase();
          const location = booking.location.toLowerCase();
          
          return (
            clientNames.includes(searchString) ||
            vendor.includes(searchString) ||
            trip.includes(searchString) ||
            serviceType.includes(searchString) ||
            location.includes(searchString)
          );
        });
      }
      
      // Apply client search filter
      if (filters.clientSearchTerm.trim()) {
        const clientSearch = filters.clientSearchTerm.toLowerCase();
        result = result.filter(booking => {
          const clientNames = booking.clients.join(" ").toLowerCase();
          return clientNames.includes(clientSearch);
        });
      }
      
      // Apply service type filter
      if (filters.serviceTypes.length > 0) {
        result = result.filter(booking => 
          filters.serviceTypes.includes(booking.serviceType)
        );
      }
      
      // Apply date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        result = result.filter(booking => {
          const bookingDate = new Date(booking.startDate);
          
          if (filters.dateRange.from && filters.dateRange.to) {
            return bookingDate >= filters.dateRange.from && 
                   bookingDate <= filters.dateRange.to;
          }
          
          if (filters.dateRange.from) {
            return bookingDate >= filters.dateRange.from;
          }
          
          if (filters.dateRange.to) {
            return bookingDate <= filters.dateRange.to;
          }
          
          return true;
        });
      }
      
      // Apply booking status filter
      if (filters.bookingStatuses.length > 0) {
        result = result.filter(booking => 
          filters.bookingStatuses.includes(booking.bookingStatus)
        );
      }
      
      // Apply commission status filter
      if (filters.commissionStatuses.length > 0) {
        result = result.filter(booking => 
          filters.commissionStatuses.includes(booking.commissionStatus)
        );
      }
      
      setFilteredBookings(result);
    };
    
    applyFiltersAndSearch();
  }, [bookings, searchTerm, filters]);

  // Function to get booking status badge styling
  const getBookingStatusBadgeStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Confirmed:
        return "bg-green-100 text-green-800";
      case BookingStatus.Pending:
        return "bg-yellow-100 text-yellow-800";
      case BookingStatus.Canceled:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get commission status badge styling
  const getCommissionStatusBadgeStyle = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.Received:
        return "bg-green-100 text-green-800";
      case CommissionStatus.Unreceived:
        return "bg-yellow-100 text-yellow-800";
      case CommissionStatus.Completed:
        return "bg-blue-100 text-blue-800";
      case CommissionStatus.Canceled:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: BookingFiltersType) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <Button onClick={() => navigate("/bookings/new")}>
          <FilePlus2 className="mr-2 h-4 w-4" />
          Create New Booking
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Booking Management</CardTitle>
          <CardDescription>View and manage all client bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <BookingFilters 
              onFilterChange={handleFilterChange} 
              serviceTypes={serviceTypes}
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client(s)</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span>Loading bookings...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <TableRow 
                      key={booking.id} 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.clients.join(", ") || "No clients"}</span>
                        </div>
                        {booking.trip && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {booking.trip}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.serviceType}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {booking.vendor}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                        </div>
                        {booking.endDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            to {new Date(booking.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${booking.cost.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-primary">${booking.commissionAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {booking.commissionRate}% rate
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge className={getBookingStatusBadgeStyle(booking.bookingStatus)}>
                            {booking.isCompleted ? <Check className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                            {booking.bookingStatus}
                          </Badge>
                          <Badge className={getCommissionStatusBadgeStyle(booking.commissionStatus)} variant="outline">
                            {booking.commissionStatus}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No bookings found. Try a different search term or create a new booking.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsPage;
