import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Users, Plane, CreditCard, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TripStatus, UserRole } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface HelpfulLink {
  id: string;
  title: string;
  url: string;
  description?: string;
}

interface Trip {
  id: string;
  name: string;
  clients: string;
  startDate: string;
  endDate?: string;
  status?: string;
}

interface Booking {
  id: string;
  clients: string;
  service: string;
  vendor: string;
  date: string;
}

const DashboardPage = () => {
  const [helpfulLinks, setHelpfulLinks] = useState<HelpfulLink[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [highPriorityTrips, setHighPriorityTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState({
    activeTrips: 0,
    totalClients: 0,
    bookingsThisMonth: 0,
    commissionYtd: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Check if user exists
        if (!user) {
          return;
        }
        
        // Determine if the user is an admin or agent
        const isAdmin = user.role === UserRole.Admin || user.role === UserRole.SuperAdmin;
        
        // Fetch helpful links
        const { data: linksData, error: linksError } = await supabase
          .from('helpful_links')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (linksError) throw linksError;
        setHelpfulLinks(linksData.map(link => ({
          id: link.id,
          title: link.title,
          url: link.url,
          description: link.description
        })));
        
        // Fetch active trips (status = 'Ongoing')
        let activeTripsQuery = supabase
          .from('trips')
          .select('*')
          .eq('status', 'Ongoing')
          .order('start_date')
          .limit(5);
        
        // If user is an agent, only show trips they are assigned to
        if (!isAdmin) {
          activeTripsQuery = activeTripsQuery.eq('agent_id', user.id);
        }
        
        const { data: activeTripsData, error: activeTripsError } = await activeTripsQuery;
        
        if (activeTripsError) throw activeTripsError;
        
        // Transform active trips with client names
        if (activeTripsData && activeTripsData.length > 0) {
          const processedActiveTrips = await Promise.all(activeTripsData.map(async (trip) => {
            // Get clients for this trip
            const clientNames = await getClientNamesForTrip(trip.id);
            
            return {
              id: trip.id,
              name: trip.name,
              clients: clientNames,
              startDate: trip.start_date,
              endDate: trip.end_date
            };
          }));
          
          setActiveTrips(processedActiveTrips);
        } else {
          setActiveTrips([]);
        }
        
        // Fetch upcoming trips (status = 'Planned' and start_date > today)
        const today = new Date().toISOString().split('T')[0];
        let upcomingTripsQuery = supabase
          .from('trips')
          .select('*')
          .eq('status', 'Planned')
          .gt('start_date', today)
          .order('start_date')
          .limit(5);
          
        // If user is an agent, only show trips they are assigned to
        if (!isAdmin) {
          upcomingTripsQuery = upcomingTripsQuery.eq('agent_id', user.id);
        }
        
        const { data: upcomingTripsData, error: upcomingTripsError } = await upcomingTripsQuery;
        
        if (upcomingTripsError) throw upcomingTripsError;
        
        // Transform upcoming trips with client names
        if (upcomingTripsData && upcomingTripsData.length > 0) {
          const processedUpcomingTrips = await Promise.all(upcomingTripsData.map(async (trip) => {
            // Get clients for this trip
            const clientNames = await getClientNamesForTrip(trip.id);
            
            return {
              id: trip.id,
              name: trip.name,
              clients: clientNames,
              startDate: trip.start_date,
              endDate: trip.end_date
            };
          }));
          
          setUpcomingTrips(processedUpcomingTrips);
        } else {
          setUpcomingTrips([]);
        }
        
        // Fetch high priority trips
        let highPriorityTripsQuery = supabase
          .from('trips')
          .select('*')
          .eq('high_priority', true)
          .order('start_date')
          .limit(5);
          
        // If user is an agent, only show trips they are assigned to
        if (!isAdmin) {
          highPriorityTripsQuery = highPriorityTripsQuery.eq('agent_id', user.id);
        }
        
        const { data: highPriorityTripsData, error: highPriorityTripsError } = await highPriorityTripsQuery;
        
        if (highPriorityTripsError) throw highPriorityTripsError;
        
        // Transform high priority trips with client names and status
        if (highPriorityTripsData && highPriorityTripsData.length > 0) {
          const processedHighPriorityTrips = await Promise.all(highPriorityTripsData.map(async (trip) => {
            // Get clients for this trip
            const clientNames = await getClientNamesForTrip(trip.id);
            
            return {
              id: trip.id,
              name: trip.name,
              clients: clientNames,
              startDate: trip.start_date,
              status: trip.status
            };
          }));
          
          setHighPriorityTrips(processedHighPriorityTrips);
        } else {
          setHighPriorityTrips([]);
        }
        
        // Fetch recent bookings
        let recentBookingsQuery = supabase
          .from('bookings')
          .select('id, vendor_id, service_type_id, start_date, created_at')
          .order('created_at', { ascending: false })
          .limit(3);
          
        // If user is an agent, only show bookings they are assigned to
        if (!isAdmin) {
          recentBookingsQuery = recentBookingsQuery.eq('agent_id', user.id);
        }
        
        const { data: recentBookingsData, error: recentBookingsError } = await recentBookingsQuery;
        
        if (recentBookingsError) throw recentBookingsError;
        
        // Transform recent bookings with details
        if (recentBookingsData && recentBookingsData.length > 0) {
          const processedRecentBookings = await Promise.all(recentBookingsData.map(async (booking) => {
            // Get clients for this booking
            const clientNames = await getClientNamesForBooking(booking.id);
            
            // Get service type name
            const { data: serviceTypeData } = await supabase
              .from('service_types')
              .select('name')
              .eq('id', booking.service_type_id)
              .single();
            
            // Get vendor name
            const { data: vendorData } = await supabase
              .from('vendors')
              .select('name')
              .eq('id', booking.vendor_id)
              .single();
            
            return {
              id: booking.id,
              clients: clientNames,
              service: serviceTypeData?.name || 'Unknown Service',
              vendor: vendorData?.name || 'Unknown Vendor',
              date: booking.start_date
            };
          }));
          
          setRecentBookings(processedRecentBookings);
        } else {
          setRecentBookings([]);
        }
        
        // Fetch statistics, filtered by agent for non-admin users
        // 1. Count of active trips
        let activeTripsCountQuery = supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Ongoing');
        
        if (!isAdmin) {
          activeTripsCountQuery = activeTripsCountQuery.eq('agent_id', user.id);
        }
        
        const { count: activeTripsCount, error: activeTripsCountError } = await activeTripsCountQuery;
        
        if (activeTripsCountError) throw activeTripsCountError;
        
        // 2. Count of total clients for this agent or all clients for admin
        let totalClientsQuery;
        
        if (isAdmin) {
          totalClientsQuery = supabase
            .from('clients')
            .select('*', { count: 'exact', head: true });
        } else {
          // Get unique clients from agent's bookings
          const { data: bookingClients } = await supabase
            .from('bookings')
            .select('id')
            .eq('agent_id', user.id);
            
          if (bookingClients && bookingClients.length > 0) {
            const bookingIds = bookingClients.map(b => b.id);
            
            const { data: clientIds } = await supabase
              .from('booking_clients')
              .select('client_id')
              .in('booking_id', bookingIds);
              
            if (clientIds && clientIds.length > 0) {
              const uniqueClientIds = [...new Set(clientIds.map(c => c.client_id))];
              totalClientsQuery = supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .in('id', uniqueClientIds);
            } else {
              // Agent has no clients
              setStats(prev => ({ ...prev, totalClients: 0 }));
              totalClientsQuery = null;
            }
          } else {
            // Agent has no bookings
            setStats(prev => ({ ...prev, totalClients: 0 }));
            totalClientsQuery = null;
          }
        }
        
        let totalClientsCount = 0;
        
        if (totalClientsQuery) {
          const { count: clientCount, error: totalClientsCountError } = await totalClientsQuery;
          
          if (totalClientsCountError) throw totalClientsCountError;
          
          totalClientsCount = clientCount || 0;
        }
        
        // 3. Count of bookings this month
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];
        
        const lastDayOfMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0);
        const lastDayOfMonthStr = lastDayOfMonth.toISOString().split('T')[0];
        
        let bookingsThisMonthQuery = supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('start_date', firstDayOfMonthStr)
          .lte('start_date', lastDayOfMonthStr);
          
        // If user is an agent, only count their bookings
        if (!isAdmin) {
          bookingsThisMonthQuery = bookingsThisMonthQuery.eq('agent_id', user.id);
        }
        
        const { count: bookingsThisMonthCount, error: bookingsThisMonthError } = await bookingsThisMonthQuery;
        
        if (bookingsThisMonthError) throw bookingsThisMonthError;
        
        // 4. Sum of commission this year from confirmed bookings
        const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        
        let commissionQuery = supabase
          .from('bookings')
          .select('commission_amount')
          .eq('booking_status', 'Confirmed')
          .gte('start_date', firstDayOfYear);
          
        // If user is an agent, only count their commissions
        if (!isAdmin) {
          commissionQuery = commissionQuery.eq('agent_id', user.id);
        }
        
        const { data: commissionData, error: commissionError } = await commissionQuery;
        
        if (commissionError) throw commissionError;
        
        const commissionYtd = commissionData.reduce((sum, booking) => sum + (booking.commission_amount || 0), 0);
        
        // Set all statistics
        setStats({
          activeTrips: activeTripsCount || 0,
          totalClients: totalClientsCount,
          bookingsThisMonth: bookingsThisMonthCount || 0,
          commissionYtd: commissionYtd
        });
        
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Failed to load dashboard data",
          description: error.message || "There was an error loading the dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast, user]);

  // Helper function to get client names for a trip
  const getClientNamesForTrip = async (tripId: string): Promise<string> => {
    try {
      const { data: tripClientsData, error: tripClientsError } = await supabase
        .from('trip_clients')
        .select('client_id')
        .eq('trip_id', tripId);
      
      if (tripClientsError) throw tripClientsError;
      
      if (tripClientsData.length === 0) return 'No clients';
      
      const clientIds = tripClientsData.map(tc => tc.client_id);
      
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
      console.error('Error fetching clients for trip:', error);
      return 'Error fetching clients';
    }
  };

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Trips" 
          value={stats.activeTrips.toString()} 
          icon={<Plane className="h-5 w-5" />}
        />
        <StatCard 
          title="Total Clients" 
          value={stats.totalClients.toString()} 
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard 
          title="Bookings This Month" 
          value={stats.bookingsThisMonth.toString()} 
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <StatCard 
          title="Commission (YTD)" 
          value={`$${stats.commissionYtd.toLocaleString()}`} 
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Helpful Links">
          <div className="space-y-2">
            {loading ? (
              <p className="text-center py-4 text-sm text-muted-foreground">Loading links...</p>
            ) : helpfulLinks.length > 0 ? (
              helpfulLinks.map((link) => (
                <Card key={link.id} className="p-3 hover:bg-muted/50 cursor-pointer">
                  <a href={link.url} className="text-sm font-medium" target="_blank" rel="noopener noreferrer">{link.title}</a>
                  {link.description && (
                    <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                  )}
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">No helpful links found.</p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="Active Trips">
          <div className="space-y-2">
            {loading ? (
              <p className="text-center py-4 text-sm text-muted-foreground">Loading trips...</p>
            ) : activeTrips.length > 0 ? (
              activeTrips.map((trip) => (
                <Card 
                  key={trip.id} 
                  className="p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{trip.name}</p>
                      <p className="text-xs text-muted-foreground">{trip.clients}</p>
                    </div>
                    <div className="text-xs text-right">
                      <p className="text-foreground">
                        {new Date(trip.startDate).toLocaleDateString()} 
                        {trip.endDate && ` - ${new Date(trip.endDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">No active trips found.</p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="Upcoming Trips">
          <div className="space-y-2">
            {loading ? (
              <p className="text-center py-4 text-sm text-muted-foreground">Loading trips...</p>
            ) : upcomingTrips.length > 0 ? (
              upcomingTrips.map((trip) => (
                <Card 
                  key={trip.id} 
                  className="p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{trip.name}</p>
                      <p className="text-xs text-muted-foreground">{trip.clients}</p>
                    </div>
                    <div className="text-xs text-right">
                      <p className="text-foreground">{new Date(trip.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">No upcoming trips found.</p>
            )}
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCard title="High Priority Trips">
          <div className="space-y-2">
            {loading ? (
              <p className="text-center py-4 text-sm text-muted-foreground">Loading high priority trips...</p>
            ) : highPriorityTrips.length > 0 ? (
              highPriorityTrips.map((trip) => (
                <Card 
                  key={trip.id} 
                  className="p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{trip.name}</p>
                      <p className="text-xs text-muted-foreground">{trip.clients}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs">{new Date(trip.startDate).toLocaleDateString()}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        trip.status === TripStatus.Planned ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">No high priority trips found.</p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="Recent Bookings">
          <div className="space-y-2">
            {loading ? (
              <p className="text-center py-4 text-sm text-muted-foreground">Loading bookings...</p>
            ) : recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{booking.service}</p>
                      <p className="text-xs text-muted-foreground">{booking.clients} • {booking.vendor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs">{new Date(booking.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">No recent bookings found.</p>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default DashboardPage;
