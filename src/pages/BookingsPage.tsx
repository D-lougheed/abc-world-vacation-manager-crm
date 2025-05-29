import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import BookingFilters from "@/components/bookings/BookingFilters";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, BookingStatus } from "@/types";

const BookingsPage = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    vendorId: "",
    serviceTypeId: "",
    search: "",
  });
  const { toast } = useToast();
  const { user, checkUserAccess } = useAuth();
  const isAdmin = checkUserAccess(UserRole.Admin);
  
  // Fetch service types for filters
  const [serviceTypes, setServiceTypes] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    const fetchServiceTypes = async () => {
      const { data } = await supabase.from('service_types').select('id, name');
      setServiceTypes(data || []);
    };
    
    fetchServiceTypes();
  }, []);

  // Fetch bookings with optional filtering
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        
        // Start building the query
        let query = supabase
          .from('bookings')
          .select(`
            *,
            vendor:vendor_id(name),
            service_type:service_type_id(name),
            booking_clients(client_id)
          `)
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters.status !== "all") {
          query = query.eq('booking_status', filters.status as BookingStatus);
        }
        
        // Filter by vendor
        if (filters.vendorId) {
          query = query.eq('vendor_id', filters.vendorId);
        }
        
        // Filter by service type
        if (filters.serviceTypeId) {
          query = query.eq('service_type_id', filters.serviceTypeId);
        }

        // Filter by agent - if user is not admin, only show their bookings
        if (!isAdmin && user?.id) {
          query = query.eq('agent_id', user.id);
        }
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // For each booking, fetch client names
        const bookingsWithClients = await Promise.all(data.map(async (booking) => {
          // Get client IDs from booking_clients
          const clientIds = booking.booking_clients.map((bc: any) => bc.client_id);
          
          // Fetch client details
          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('id, first_name, last_name')
            .in('id', clientIds);
            
          if (clientsError) {
            console.error('Error fetching clients:', clientsError);
            return {
              ...booking,
              clients: []
            };
          }
          
          // Get agent details
          const { data: agentData, error: agentError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', booking.agent_id)
            .single();

          const agent = agentError ? null : {
            name: `${agentData?.first_name || ''} ${agentData?.last_name || ''}`.trim() || 'Unknown'
          };
          
          const formattedClients = clientsData?.map(client => ({
            id: client.id,
            name: `${client.first_name} ${client.last_name}`
          })) || [];
          
          return {
            ...booking,
            clients: formattedClients,
            agent
          };
        }));
        
        // Apply text search filter on the client side
        let filteredBookings = bookingsWithClients;
        if (filters.search) {
          const searchTerms = filters.search.toLowerCase().split(' ');
          
          filteredBookings = filteredBookings.filter(booking => {
            // Check booking location
            const matchesLocation = booking.location && 
              searchTerms.some((term: string) => booking.location.toLowerCase().includes(term));
              
            // Check vendor name
            const matchesVendor = booking.vendor?.name && 
              searchTerms.some((term: string) => booking.vendor.name.toLowerCase().includes(term));
              
            // Check clients' names
            const matchesClient = booking.clients.some((client: any) => 
              searchTerms.some((term: string) => client.name.toLowerCase().includes(term))
            );
            
            // Check service type
            const matchesService = booking.service_type?.name && 
              searchTerms.some((term: string) => booking.service_type.name.toLowerCase().includes(term));
              
            return matchesLocation || matchesVendor || matchesClient || matchesService;
          });
        }
        
        // Filter by date range
        if (filters.dateRange !== "all") {
          const now = new Date();
          let startDate;
          
          if (filters.dateRange === "upcoming") {
            // Filter for bookings in the future
            filteredBookings = filteredBookings.filter(booking => {
              return new Date(booking.start_date) >= now;
            });
          } else if (filters.dateRange === "past") {
            // Filter for past bookings
            filteredBookings = filteredBookings.filter(booking => {
              return new Date(booking.start_date) < now;
            });
          } else if (filters.dateRange === "today") {
            // Filter for today's bookings
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            filteredBookings = filteredBookings.filter(booking => {
              const bookingDate = new Date(booking.start_date);
              return bookingDate >= today && bookingDate < tomorrow;
            });
          } else if (filters.dateRange === "week") {
            // Filter for this week's bookings
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            
            filteredBookings = filteredBookings.filter(booking => {
              const bookingDate = new Date(booking.start_date);
              return bookingDate >= startOfWeek && bookingDate < endOfWeek;
            });
          } else if (filters.dateRange === "month") {
            // Filter for this month's bookings
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            
            filteredBookings = filteredBookings.filter(booking => {
              const bookingDate = new Date(booking.start_date);
              return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
            });
          }
        }

        // Filter out past bookings by default unless showPastBookings is true
        if (!showPastBookings) {
          const now = new Date();
          now.setHours(0, 0, 0, 0); // Set to start of today
          filteredBookings = filteredBookings.filter(booking => {
            return new Date(booking.start_date) >= now;
          });
        }
        
        setBookings(filteredBookings);
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: `Failed to load bookings: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [filters, showPastBookings, toast, user, isAdmin]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options as any);
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'Canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle filter changes from BookingFilters component
  const handleFilterChange = (newFilters: any) => {
    setFilters({
      status: newFilters.bookingStatuses.length === 1 ? newFilters.bookingStatuses[0] : "all",
      dateRange: newFilters.dateRange.from ? "custom" : "all",
      vendorId: "",
      serviceTypeId: newFilters.serviceTypes.length === 1 ? 
        serviceTypes.find(st => st.name === newFilters.serviceTypes[0])?.id || "" : "",
      search: newFilters.clientSearchTerm
    });
  };

  // Handle checkbox change for showing past bookings
  const handleShowPastBookingsChange = (checked: boolean | "indeterminate") => {
    setShowPastBookings(checked === true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bookings</h1>
        
        <Button asChild>
          <Link to="/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>
      
      <Separator />
      
      <BookingFilters serviceTypes={serviceTypes} onFilterChange={handleFilterChange} />
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-past-bookings"
          checked={showPastBookings}
          onCheckedChange={handleShowPastBookingsChange}
        />
        <label
          htmlFor="show-past-bookings"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Show past bookings
        </label>
      </div>
      
      <Tabs defaultValue="list" className="mt-2">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Clients</th>
                    <th className="text-left py-3 px-4">Vendor</th>
                    <th className="text-left py-3 px-4">Service Type</th>
                    <th className="text-left py-3 px-4">Cost</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr 
                      key={booking.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => window.location.href = `/bookings/${booking.id}`}
                    >
                      <td className="py-3 px-4">{formatDate(booking.start_date)}</td>
                      <td className="py-3 px-4">
                        {booking.clients.length > 0 
                          ? booking.clients.map((client: any) => client.name).join(', ')
                          : 'No clients'
                        }
                      </td>
                      <td className="py-3 px-4">{booking.vendor?.name || 'Unknown'}</td>
                      <td className="py-3 px-4">{booking.service_type?.name || 'Unknown'}</td>
                      <td className="py-3 px-4">${booking.cost.toLocaleString()}</td>
                      <td className="py-3 px-4">{getStatusBadge(booking.booking_status)}</td>
                      <td className="py-3 px-4">{booking.agent?.name || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="calendar">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Calendar view coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingsPage;
