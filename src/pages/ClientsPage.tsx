
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search,
  UserPlus,
  FilePlus2,
  Calendar,
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

const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Dummy data - in a real app, this would come from your database
  const clients = [
    { id: "1", firstName: "John", lastName: "Smith", dateCreated: "2023-01-15", lastUpdated: "2023-05-01", tripsCount: 3, bookingsCount: 5 },
    { id: "2", firstName: "Sarah", lastName: "Johnson", dateCreated: "2023-02-10", lastUpdated: "2023-04-28", tripsCount: 1, bookingsCount: 2 },
    { id: "3", firstName: "Michael", lastName: "Davis", dateCreated: "2023-03-05", lastUpdated: "2023-05-10", tripsCount: 2, bookingsCount: 4 },
    { id: "4", firstName: "Emma", lastName: "Wilson", dateCreated: "2023-03-15", lastUpdated: "2023-04-15", tripsCount: 0, bookingsCount: 1 },
    { id: "5", firstName: "Robert", lastName: "Thompson", dateCreated: "2023-04-02", lastUpdated: "2023-05-05", tripsCount: 1, bookingsCount: 3 },
  ];

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
                {filteredClients.map((client) => (
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
                          // Add logic to create a new trip for this client
                        }}>
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => {
                          e.stopPropagation();
                          // Add logic to create a new booking for this client
                        }}>
                          <FilePlus2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClients.length === 0 && (
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
