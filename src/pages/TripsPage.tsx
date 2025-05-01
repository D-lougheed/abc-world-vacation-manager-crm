
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Calendar,
  Plus,
  Users,
  CalendarRange,
  AlertTriangle
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
import { TripStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface TripClient {
  first_name: string;
  last_name: string;
}

interface Trip {
  id: string;
  name: string;
  clients: string[];
  status: TripStatus;
  startDate: string;
  endDate: string;
  isHighPriority: boolean;
  bookingsCount: number;
}

const TripsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch trips from Supabase
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        
        // Fetch trips
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .order('start_date', { ascending: false });
        
        if (tripsError) throw tripsError;
        
        // For each trip, fetch associated clients and booking count
        const tripsWithDetails = await Promise.all(tripsData.map(async (trip) => {
          // Fetch clients for this trip
          const { data: tripClients, error: tripClientsError } = await supabase
            .from('trip_clients')
            .select('client_id')
            .eq('trip_id', trip.id);
          
          if (tripClientsError) throw tripClientsError;
          
          let clientNames: string[] = [];
          if (tripClients.length > 0) {
            const clientIds = tripClients.map(relation => relation.client_id);
            const { data: clientsData, error: clientsError } = await supabase
              .from('clients')
              .select('first_name, last_name')
              .in('id', clientIds);
            
            if (clientsError) throw clientsError;
            clientNames = clientsData.map(client => `${client.first_name} ${client.last_name}`);
          }
          
          // Count bookings for this trip
          const { count: bookingsCount, error: bookingsCountError } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('trip_id', trip.id);
          
          if (bookingsCountError) throw bookingsCountError;
          
          return {
            id: trip.id,
            name: trip.name,
            clients: clientNames,
            status: trip.status,
            startDate: trip.start_date,
            endDate: trip.end_date,
            isHighPriority: trip.high_priority,
            bookingsCount: bookingsCount || 0
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
  }, [toast]);

  // Filter trips based on search term
  const filteredTrips = trips.filter((trip) => {
    const tripName = trip.name.toLowerCase();
    const clients = trip.clients.join(" ").toLowerCase();
    return tripName.includes(searchTerm.toLowerCase()) || clients.includes(searchTerm.toLowerCase());
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
                  <TableHead>Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading trips...
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
                          <span>{trip.clients.join(", ")}</span>
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
                      <TableCell>{trip.bookingsCount}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
