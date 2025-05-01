
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search,
  UserPlus,
  FilePlus2,
  Calendar,
  Loader2,
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
import { useToast } from "@/components/ui/use-toast";
import { Client } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface ClientWithCounts extends Client {
  tripsCount: number;
  bookingsCount: number;
}

const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<ClientWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch clients from Supabase
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('last_name');
        
        if (clientsError) throw clientsError;

        // For each client, get trip count and booking count
        const clientsWithCounts = await Promise.all((clientsData || []).map(async (client) => {
          // Count trips for this client
          const { count: tripsCount, error: tripsError } = await supabase
            .from('trip_clients')
            .select('trip_id', { count: 'exact', head: true })
            .eq('client_id', client.id);
          
          if (tripsError) console.error('Error fetching trip count:', tripsError);
          
          // Count bookings for this client
          const { count: bookingsCount, error: bookingsError } = await supabase
            .from('booking_clients')
            .select('booking_id', { count: 'exact', head: true })
            .eq('client_id', client.id);
          
          if (bookingsError) console.error('Error fetching booking count:', bookingsError);
          
          return {
            ...client,
            tripsCount: tripsCount || 0,
            bookingsCount: bookingsCount || 0
          };
        }));
        
        setClients(clientsWithCounts);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        toast({
          title: "Failed to load clients",
          description: error.message || "There was an error loading client data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [toast]);

  // Filter clients based on search term
  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Button onClick={() => navigate("/clients/new")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>Manage your client database and access client details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span>Loading clients...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/clients/${client.id}`)}>
                      <TableCell className="font-medium">
                        {client.firstName} {client.lastName}
                      </TableCell>
                      <TableCell>{new Date(client.dateCreated).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(client.lastUpdated).toLocaleDateString()}</TableCell>
                      <TableCell>{client.tripsCount}</TableCell>
                      <TableCell>{client.bookingsCount}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/trips/new?clientId=${client.id}`);
                          }}>
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/bookings/new?clientId=${client.id}`);
                          }}>
                            <FilePlus2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No clients found. Try a different search term or add a new client.
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

export default ClientsPage;
