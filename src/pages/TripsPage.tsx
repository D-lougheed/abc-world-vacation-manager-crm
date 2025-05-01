
import { useState } from "react";
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

const TripsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Dummy data
  const trips = [
    { id: "1", name: "European Adventure", clients: ["Smith Family", "Johnson"], status: TripStatus.Planned, startDate: "2023-06-15", endDate: "2023-06-25", isHighPriority: false, bookingsCount: 4 },
    { id: "2", name: "Caribbean Cruise", clients: ["Williams Group"], status: TripStatus.Confirmed, startDate: "2023-07-10", endDate: "2023-07-17", isHighPriority: false, bookingsCount: 2 },
    { id: "3", name: "African Safari", clients: ["Taylor Party"], status: TripStatus.Completed, startDate: "2023-04-05", endDate: "2023-04-15", isHighPriority: false, bookingsCount: 5 },
    { id: "4", name: "Last-minute NYC Trip", clients: ["Brown Family"], status: TripStatus.Planned, startDate: "2023-05-25", endDate: "2023-05-28", isHighPriority: true, bookingsCount: 3 },
    { id: "5", name: "Tokyo Adventure", clients: ["Wilson"], status: TripStatus.Canceled, startDate: "2023-05-01", endDate: "2023-05-10", isHighPriority: false, bookingsCount: 0 },
  ];

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
      case TripStatus.Confirmed:
        return "bg-purple-100 text-purple-800";
      case TripStatus.Ongoing:
        return "bg-amber-100 text-amber-800";
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
                {filteredTrips.map((trip) => (
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
                ))}
                {filteredTrips.length === 0 && (
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
