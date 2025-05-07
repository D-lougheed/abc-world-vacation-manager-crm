
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Calendar,
  Plus,
  Users,
  CalendarRange,
  AlertTriangle,
  Loader2,
  UserCircle
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
import { TripStatus, UserRole } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TripWithDetails {
  id: string;
  name: string;
  clients: string[];
  status: TripStatus;
  startDate: string;
  endDate: string;
  isHighPriority: boolean;
  bookingsCount: number;
  agentName?: string;
}

const TripsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch trips from Supabase
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          return;
        }
        
        // Determine if user is admin
        const isAdmin = user.role === UserRole.Admin || user.role === UserRole.SuperAdmin;
        
        // Fetch trips
        let tripsQuery = supabase.from('trips').select('*').order('start_date', { ascending: false });
        
        // If user is an agent, only show their trips
        if (!isAdmin) {
          tripsQuery = tripsQuery.eq('agent_id', user.id);
        }
        
        const { data: tripsData, error: tripsError } = await tripsQuery;
        
        if (tripsError) throw tripsError;
        
        // For each trip, fetch associated clients, agent and booking count
        const tripsWithDetails = await Promise.all((tripsData || []).map(async (trip) => {
          // Fetch clients for this trip
          const { data: tripClients, error: tripClientsError } = await supabase
            .from('trip_clients')
            .select('client_id')
            .eq('trip_id', trip.id);
          
          if (tripClientsError) console.error('Error fetching trip clients:', tripClientsError);
          
          let clientNames: string[] = [];
          if (tripClients && tripClients.length > 0) {
            const clientIds = tripClients.map(relation => relation.client_id);
            const { data: clientsData, error: clientsError } = await supabase
              .from('clients')
              .select('first_name, last_name')
              .in('id', clientIds);
            
            if (clientsError) console.error('Error fetching clients:', clientsError);
            clientNames = clientsData ? clientsData.map(client => `${client.first_name} ${client.last_name}`) : [];
          }
          
          // Fetch agent name if agent_id exists
          let agentName: string | undefined;
          if (trip.agent_id) {
            const { data: agentData, error: agentError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', trip.agent_id)
              .single();
              
            if (!agentError && agentData) {
              agentName = `${agentData.first_name} ${agentData.last_name}`;
            }
          }
          
          // Count bookings for this trip
          const { count: bookingsCount, error: bookingsCountError } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('trip_id', trip.id);
          
          if (bookingsCountError) console.error('Error counting bookings:', bookingsCountError);
          
          return {
            id: trip.id,
            name: trip.name,
            clients: clientNames,
            status: trip.status as TripStatus,
            startDate: trip.start_date,
            endDate: trip.end_date,
            isHighPriority: trip.high_priority,
            bookingsCount: bookingsCount || 0,
            agentName
          };
        }));
        
        setTrips(tripsWithDetails);
      } catch (error: any) {
        console.error('Error fetching trips:', error);
        toast({
          title: "Failed to load trips",
          description: error.message || "There was an error loading trip data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [toast, user]);

  // Filter trips based on search term
  const filteredTrips = trips.filter((trip) => {
    const tripName = trip.name.toLowerCase();
    const clients = trip.clients.join(" ").toLowerCase();
    const agent = trip.agentName?.toLowerCase() || "";
    return (
      tripName.includes(searchTerm.toLowerCase()) || 
      clients.includes(searchTerm.toLowerCase()) ||
      agent.includes(searchTerm.toLowerCase())
    );
  });

  // Function to get status badge styling
  const getStatusBadgeStyle = (status: TripStatus) => {
    switch (status) {
      case TripStatus.Planned:
        return "bg-blue-100 text-blue-800";
      case TripStatus.Ongoing:
        return "bg-purple-100 text-purple-800";
      case TripStatus.Completed:
        return "bg-green-100 text-green-800";
      case TripStatus.Canceled:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trips</h1>
        <Button onClick={() => navigate("/trips/new")}>
          <Calendar className="mr-2 h-4 w-4" />
          Create New Trip
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Trip Management</CardTitle>
          <CardDescription>View and manage all client trips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trips..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip Name</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span>Loading trips...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTrips.length > 0 ? (
                  filteredTrips.map((trip) => (
                    <TableRow 
                      key={trip.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${trip.isHighPriority ? 'bg-amber-50' : ''}`} 
                      onClick={() => navigate(`/trips/${trip.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center">
                          {trip.isHighPriority && (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                          )}
                          <span className="font-medium">{trip.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-muted-foreground mr-2" />
                          <span>{trip.clients.length > 0 ? trip.clients.join(", ") : "No clients"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeStyle(trip.status)}>
                          {trip.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarRange className="h-4 w-4 text-muted-foreground mr-2" />
                          <span>
                            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <UserCircle className="h-4 w-4 text-muted-foreground mr-2" />
                          <span>{trip.agentName || "Unassigned"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{trip.bookingsCount}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No trips found. Try a different search term or create a new trip.
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

export default TripsPage;
