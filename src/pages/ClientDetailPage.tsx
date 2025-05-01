
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  User,
  Calendar,
  FileText,
  Clock,
  Upload,
  CalendarCheck,
  FilePlus2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [notes, setNotes] = useState("Client prefers aisle seats on flights. Allergic to shellfish.");

  // In a real app, you would fetch client data based on the ID
  const client = {
    id: id || "1",
    firstName: "John",
    lastName: "Smith",
    dateCreated: "2023-01-15",
    lastUpdated: "2023-05-01",
    trips: [
      { id: "1", name: "European Adventure", startDate: "2023-06-15", endDate: "2023-06-25", status: "Planned" },
      { id: "2", name: "Caribbean Cruise", startDate: "2023-08-10", endDate: "2023-08-17", status: "Planned" },
      { id: "3", name: "New York Weekend", startDate: "2023-03-15", endDate: "2023-03-17", status: "Completed" },
    ],
    bookings: [
      { id: "1", service: "Flight to Paris", vendor: "Delta Airlines", startDate: "2023-06-15", cost: 850, status: "Confirmed" },
      { id: "2", name: "Hotel in Paris", vendor: "Hotel Splendid", startDate: "2023-06-15", endDate: "2023-06-20", cost: 1200, status: "Confirmed" },
      { id: "3", name: "Train to Rome", vendor: "EuroRail", startDate: "2023-06-20", cost: 150, status: "Pending" },
      { id: "4", name: "Hotel in Rome", vendor: "Grand Roma Hotel", startDate: "2023-06-20", endDate: "2023-06-25", cost: 950, status: "Pending" },
    ],
    documents: [
      { id: "1", name: "Passport.pdf", uploadDate: "2023-02-10" },
      { id: "2", name: "Travel Insurance.pdf", uploadDate: "2023-04-12" },
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{client.firstName} {client.lastName}</h1>
            <p className="text-sm text-muted-foreground">Client since {new Date(client.dateCreated).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <CalendarCheck className="mr-2 h-4 w-4" />
            New Trip
          </Button>
          <Button>
            <FilePlus2 className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                <dd>{client.firstName} {client.lastName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Client Since</dt>
                <dd>{new Date(client.dateCreated).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                <dd>{new Date(client.lastUpdated).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Notes</span>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </dt>
                <dd className="mt-1">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </dd>
              </div>
              <div>
                <dt className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Documents</span>
                  <Button variant="ghost" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </dt>
                <dd>
                  <div className="space-y-2">
                    {client.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{doc.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 md:col-span-2">
          <Tabs defaultValue="trips">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle>Travel History</CardTitle>
                <TabsList>
                  <TabsTrigger value="trips">
                    <Calendar className="mr-2 h-4 w-4" />
                    Trips
                  </TabsTrigger>
                  <TabsTrigger value="bookings">
                    <Clock className="mr-2 h-4 w-4" />
                    Bookings
                  </TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>View all trips and bookings for this client</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <TabsContent value="trips" className="m-0">
                <div className="space-y-3">
                  {client.trips.length > 0 ? (
                    client.trips.map((trip) => (
                      <div key={trip.id} className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{trip.name}</p>
                          <div className="text-sm text-muted-foreground">
                            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            trip.status === "Completed" ? "bg-green-100 text-green-800" : 
                            trip.status === "Planned" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {trip.status}
                          </span>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No trips found for this client.</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="bookings" className="m-0">
                <div className="space-y-3">
                  {client.bookings.length > 0 ? (
                    client.bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{booking.service || booking.name}</p>
                          <div className="text-sm text-muted-foreground">
                            {booking.vendor} • ${booking.cost}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            booking.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {booking.status}
                          </span>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No bookings found for this client.</p>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ClientDetailPage;
