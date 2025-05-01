
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Loader2
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const TripDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [notes, setNotes] = useState("");
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch trip data from Supabase
  useEffect(() => {
    const fetchTripData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          toast({
            title: "Error",
            description: "No trip ID provided",
            variant: "destructive"
          });
          navigate("/trips");
          return;
        }
        
        // Fetch trip data
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();
        
        if (tripError) throw tripError;
        if (!tripData) {
          toast({
            title: "Trip not found",
            description: "The trip you're looking for doesn't exist",
            variant: "destructive"
          });
          navigate("/trips");
          return;
        }

        // Set notes and high priority status
        setNotes(tripData.notes || "");
        setIsHighPriority(tripData.high_priority || false);
        
        // Fetch associated clients
        const { data: clientRelations, error: clientRelationsError } = await supabase
          .from('trip_clients')
          .select('client_id')
          .eq('trip_id', id);
        
        if (clientRelationsError) throw clientRelationsError;
        
        let clients = [];
        if (clientRelations && clientRelations.length > 0) {
          const clientIds = clientRelations.map(relation => relation.client_id);
          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('id, first_name, last_name')
            .in('id', clientIds);
          
          if (clientsError) throw clientsError;
          
          // Fixed: Remove email property as it doesn't exist in the clients table
          clients = clientsData?.map(client => ({
            id: client.id,
            name: `${client.first_name} ${client.last_name}`,
            email: "" // Set email to empty string since it doesn't exist in the table
          })) || [];
        }
        
        // Fetch bookings for this trip
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id, 
            cost, 
            start_date, 
            end_date, 
            booking_status,
            location,
            service_type:service_type_id(name),
            vendor:vendor_id(name)
          `)
          .eq('trip_id', id);
        
        if (bookingsError) throw bookingsError;
        
        const bookings = bookingsData?.map(booking => ({
          id: booking.id,
          service: booking.service_type?.name || "Unknown Service",
          name: booking.service_type?.name || "Unknown Service",
          vendor: booking.vendor?.name || "Unknown Vendor",
          startDate: booking.start_date,
          endDate: booking.end_date,
          cost: booking.cost,
          status: booking.booking_status,
          location: booking.location
        })) || [];
        
        // Construct the complete trip object
        const completeTrip = {
          id: tripData.id,
          name: tripData.name,
          status: tripData.status as TripStatus,
          startDate: tripData.start_date,
          endDate: tripData.end_date,
          isHighPriority: tripData.high_priority,
          description: tripData.description || "",
          clients,
          bookings,
          notes: tripData.notes || ""
        };
        
        setTrip(completeTrip);
      } catch (error: any) {
        console.error("Error fetching trip details:", error);
        toast({
          title: "Error loading trip details",
          description: error.message || "There was an error loading the trip details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [id, navigate, toast]);

  // Function to update notes
  const updateNotes = async () => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ notes })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Notes updated",
        description: "Trip notes have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update notes",
        description: error.message || "There was an error updating the notes.",
        variant: "destructive"
      });
    }
  };
  
  // Function to update high priority status
  const updateHighPriority = async (value: boolean) => {
    try {
      setIsHighPriority(value);
      
      const { error } = await supabase
        .from('trips')
        .update({ high_priority: value })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Priority updated",
        description: `Trip has been marked as ${value ? "high" : "normal"} priority.`,
      });
    } catch (error: any) {
      // Revert UI if update fails
      setIsHighPriority(!value);
      
      toast({
        title: "Failed to update priority",
        description: error.message || "There was an error updating the priority status.",
        variant: "destructive"
      });
    }
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
  
  // Function to update trip status
  const updateStatus = async (newStatus: TripStatus) => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setTrip(prevTrip => ({
        ...prevTrip,
        status: newStatus
      }));
      
      toast({
        title: "Status updated",
        description: `Trip status has been updated to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message || "There was an error updating the trip status.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Trip not found.</p>
      </div>
    );
  }

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
          <Button variant="outline" onClick={() => navigate(`/bookings/new?tripId=${trip.id}`)}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Add Booking
          </Button>
          <Button onClick={() => navigate(`/trips/${id}/edit`)}>
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
                    <Button 
                      size="sm" 
                      variant={trip.status === TripStatus.Planned ? "default" : "outline"}
                      onClick={() => updateStatus(TripStatus.Planned)}
                    >
                      Planned
                    </Button>
                    <Button 
                      size="sm" 
                      variant={trip.status === TripStatus.Ongoing ? "default" : "outline"}
                      onClick={() => updateStatus(TripStatus.Ongoing)}
                    >
                      Ongoing
                    </Button>
                    <Button 
                      size="sm" 
                      variant={trip.status === TripStatus.Completed ? "default" : "outline"}
                      onClick={() => updateStatus(TripStatus.Completed)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Completed
                    </Button>
                    <Button 
                      size="sm" 
                      variant={trip.status === TripStatus.Canceled ? "destructive" : "outline"}
                      onClick={() => updateStatus(TripStatus.Canceled)}
                    >
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
                  onCheckedChange={updateHighPriority}
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
                    {trip.clients.length > 0 ? (
                      trip.clients.map((client) => (
                        <div key={client.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{client.name}</span>
                          </div>
                          {client.email && (
                            <span className="text-xs text-muted-foreground">
                              {client.email}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No clients assigned</div>
                    )}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/trips/${id}/edit`)}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage Clients
                    </Button>
                  </div>
                </dd>
              </div>
              <div>
                <dt className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Notes</span>
                </dt>
                <dd>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                    onBlur={updateNotes}
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
                  <Button onClick={() => navigate(`/bookings/new?tripId=${trip.id}`)}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Add Booking
                  </Button>
                </div>

                <div className="space-y-3">
                  {trip.bookings.length > 0 ? (
                    trip.bookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
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
                  {trip.bookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((booking) => (
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
