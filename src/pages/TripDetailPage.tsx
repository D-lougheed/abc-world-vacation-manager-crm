import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  Users,
  FileText,
  Edit,
  FilePlus2,
  AlertTriangle,
  Check,
  X,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TripStatus } from "@/types";

const TripDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [notes, setNotes] = useState("Clients are celebrating their 25th anniversary. Requested romantic experiences throughout the trip. Mentioned interest in fine dining and wine tours.");
  const [isHighPriority, setIsHighPriority] = useState(false);

  // In a real app, you would fetch trip data based on the ID
  const trip = {
    id: id || "1",
    name: "European Adventure",
    status: TripStatus.Planned,
    startDate: "2023-06-15",
    endDate: "2023-06-25",
    isHighPriority: false,
    description: "A 10-day adventure through France and Italy, visiting Paris, Lyon, Florence, and Rome.",
    clients: [
      { id: "1", name: "John Smith", email: "john@example.com" },
      { id: "2", name: "Jane Smith", email: "jane@example.com" }
    ],
    bookings: [
      { id: "1", service: "Flight to Paris", vendor: "Delta Airlines", startDate: "2023-06-15", cost: 850, status: "Confirmed" },
      { id: "2", name: "Hotel in Paris", vendor: "Hotel Splendid", startDate: "2023-06-15", endDate: "2023-06-20", cost: 1200, status: "Confirmed" },
      { id: "3", name: "Train to Rome", vendor: "EuroRail", startDate: "2023-06-20", cost: 150, status: "Pending" },
      { id: "4", name: "Hotel in Rome", vendor: "Grand Roma Hotel", startDate: "2023-06-20", endDate: "2023-06-25", cost: 950, status: "Pending" },
      { id: "5", name: "Airport Transfer", vendor: "Paris Shuttle", startDate: "2023-06-15", cost: 80, status: "Confirmed" },
    ]
  };

  // Function to get status badge styling
  const getStatusBadgeStyle = (status: TripStatus) => {
    switch (status) {
      case TripStatus.Planned:
        return "bg-blue-100 text-blue-800";
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

  // Function to get booking status badge styling
  const getBookingStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate total trip cost
  const totalTripCost = trip.bookings.reduce((acc, booking) => acc + booking.cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {trip.name}
              {isHighPriority && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge className={getStatusBadgeStyle(trip.status)}>
                {trip.status}
              </Badge>
              <span>•</span>
              <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Add Booking
          </Button>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Trip
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle>Trip Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd>
                  <div className="flex mt-1 space-x-2">
                    <Button size="sm" variant={trip.status === TripStatus.Planned ? "default" : "outline"}>
                      Planned
                    </Button>
                    <Button size="sm" variant={trip.status === TripStatus.Ongoing ? "default" : "outline"}>
                      Ongoing
                    </Button>
                    <Button size="sm" variant={trip.status === TripStatus.Completed ? "default" : "outline"}>
                      <Check className="mr-1 h-3 w-3" />
                      Completed
                    </Button>
                    <Button size="sm" variant={trip.status === TripStatus.Canceled ? "destructive" : "outline"}>
                      <X className="mr-1 h-3 w-3" />
                      Canceled
                    </Button>
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Dates</dt>
                <dd className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-muted-foreground">High Priority</dt>
                <Switch
                  checked={isHighPriority}
                  onCheckedChange={setIsHighPriority}
                />
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd className="mt-1 text-sm">{trip.description}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground mb-2">Clients</dt>
                <dd>
                  <div className="space-y-2">
                    {trip.clients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{client.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {client.email}
                        </span>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Clients
                    </Button>
                  </div>
                </dd>
              </div>
              <div>
                <dt className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Notes</span>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </dt>
                <dd>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 md:col-span-2">
          <Tabs defaultValue="bookings">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle>Trip Details</CardTitle>
                <TabsList>
                  <TabsTrigger value="bookings">
                    <FileText className="mr-2 h-4 w-4" />
                    Bookings
                  </TabsTrigger>
                  <TabsTrigger value="timeline">
                    <Clock className="mr-2 h-4 w-4" />
                    Timeline
                  </TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>View all bookings and activities for this trip</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <TabsContent value="bookings" className="m-0 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Trip Cost</p>
                    <p className="text-2xl font-bold">${totalTripCost.toLocaleString()}</p>
                  </div>
                  <Button>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Add Booking
                  </Button>
                </div>

                <div className="space-y-3">
                  {trip.bookings.length > 0 ? (
                    trip.bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{booking.service || booking.name}</p>
                          <div className="text-sm text-muted-foreground">
                            {booking.vendor} • {new Date(booking.startDate).toLocaleDateString()}
                            {booking.endDate && ` - ${new Date(booking.endDate).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-right">${booking.cost}</p>
                          <Badge className={getBookingStatusBadgeStyle(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No bookings found for this trip.</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="m-0">
                <div className="relative pl-6 border-l">
                  {trip.bookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((booking, index) => (
                    <div key={booking.id} className="mb-8 relative">
                      <div className="absolute -left-[25px] mt-1.5 h-4 w-4 rounded-full border border-white bg-white">
                        <div className={`h-2 w-2 rounded-full mx-auto my-1 ${
                          booking.status === "Confirmed" ? "bg-green-500" : 
                          booking.status === "Pending" ? "bg-yellow-500" : "bg-red-500"
                        }`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {new Date(booking.startDate).toLocaleDateString()}
                          {booking.endDate && ` - ${new Date(booking.endDate).toLocaleDateString()}`}
                        </p>
                        <h3 className="text-base font-semibold mt-1">{booking.service || booking.name}</h3>
                        <p className="text-sm text-muted-foreground">{booking.vendor}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium">${booking.cost}</span>
                          <Badge className={getBookingStatusBadgeStyle(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default TripDetailPage;
