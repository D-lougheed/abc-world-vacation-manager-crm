import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Calendar,
  Clock,
  Users,
  CalendarClock,
  AlertTriangle,
  Loader2,
  MapPin,
  Save,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TripStatus } from "@/types";
import { MultiSelect } from "@/components/forms/MultiSelect";

const TripDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [isNewTrip, setIsNewTrip] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "Planned",
    highPriority: false,
    description: "",
    notes: "",
    clients: [] as string[]
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch all available clients
  useEffect(() => {
    const fetchAllClients = async () => {
      try {
        setClientsLoading(true);
        const { data, error } = await supabase
          .from("clients")
          .select("id, first_name, last_name")
          .order("first_name");

        if (error) throw error;
        
        setAvailableClients(data.map(client => ({
          value: client.id,
          label: `${client.first_name} ${client.last_name}`
        })));
      } catch (error: any) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Error",
          description: `Failed to load clients: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setClientsLoading(false);
      }
    };

    fetchAllClients();
  }, [toast]);

  useEffect(() => {
    // Check if this is a new trip
    if (id === "new") {
      setIsNewTrip(true);
      setLoading(false);
      
      // Set empty form data for new trip (no prepopulated values)
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        status: "Planned",
        highPriority: false,
        description: "",
        notes: "",
        clients: []
      });
      
      return;
    }
    
    fetchTripData();
  }, [id]);

  const fetchTripData = async () => {
    try {
      if (id === "new") {
        return; // Skip fetching for new trips
      }
      
      setLoading(true);
      
      // Fetch trip data
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();
      
      if (tripError) {
        throw tripError;
      }
      
      setTrip(tripData);
      
      // Fetch client data
      const { data: tripClientData, error: tripClientError } = await supabase
        .from("trip_clients")
        .select("client_id")
        .eq("trip_id", id);
      
      if (tripClientError) {
        throw tripClientError;
      }
      
      const clientIds: string[] = tripClientData?.map(tc => tc.client_id) || [];

      if (tripClientData && tripClientData.length > 0) {
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("*")
          .in("id", clientIds);
        
        if (clientsError) {
          throw clientsError;
        }
        
        setClients(clientsData || []);
      }

      setFormData({
        name: tripData.name,
        startDate: tripData.start_date,
        endDate: tripData.end_date,
        status: tripData.status,
        highPriority: tripData.high_priority,
        description: tripData.description || "",
        notes: tripData.notes || "",
        clients: clientIds
      });
      
      // Fetch bookings associated with this trip
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          service_type:service_type_id (name),
          vendor:vendor_id (name)
        `)
        .eq("trip_id", id)
        .order("start_date", { ascending: true });
      
      if (bookingsError) {
        throw bookingsError;
      }
      
      setBookings(bookingsData || []);
    } catch (error: any) {
      console.error("Error fetching trip details:", error);
      toast({
        title: "Error",
        description: `Failed to load trip: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked
    });
  };

  const handleClientChange = (selectedClients: string[]) => {
    setFormData({
      ...formData,
      clients: selectedClients
    });
  };

  const handleSaveTrip = async () => {
    try {
      setSaving(true);
      
      const tripData = {
        name: formData.name,
        start_date: formData.startDate,
        end_date: formData.endDate,
        status: formData.status as TripStatus,
        high_priority: formData.highPriority,
        description: formData.description,
        notes: formData.notes
      };
      
      let tripId = id;
      
      if (isNewTrip) {
        // Create a new trip
        const { data, error } = await supabase
          .from("trips")
          .insert(tripData)
          .select("id")
          .single();
        
        if (error) throw error;
        tripId = data.id;

        // Save client associations for new trip
        if (formData.clients.length > 0) {
          const clientAssociations = formData.clients.map(clientId => ({
            trip_id: tripId,
            client_id: clientId
          }));

          const { error: clientError } = await supabase
            .from("trip_clients")
            .insert(clientAssociations);

          if (clientError) throw clientError;
        }
        
        toast({
          title: "Success",
          description: "Trip created successfully!"
        });
        
        // Redirect to the new trip's page
        navigate(`/trips/${tripId}`, { replace: true });
      } else {
        // Update existing trip
        const { error } = await supabase
          .from("trips")
          .update(tripData)
          .eq("id", id);
        
        if (error) throw error;
        
        // First, delete existing client associations
        const { error: deleteError } = await supabase
          .from("trip_clients")
          .delete()
          .eq("trip_id", id);
          
        if (deleteError) throw deleteError;
        
        // Then add new client associations
        if (formData.clients.length > 0) {
          const clientAssociations = formData.clients.map(clientId => ({
            trip_id: id,
            client_id: clientId
          }));
          
          const { error: insertError } = await supabase
            .from("trip_clients")
            .insert(clientAssociations);
            
          if (insertError) throw insertError;
        }
        
        // Update the trip state
        setTrip({
          ...trip,
          ...tripData
        });
        
        toast({
          title: "Success",
          description: "Trip updated successfully!"
        });
        
        // Refresh data
        fetchTripData();
      }
    } catch (error: any) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error",
        description: `Failed to save trip: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

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

  // For new trip, show the creation form
  if (isNewTrip) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create New Trip</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Trip Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full p-2 border rounded-md"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter trip name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="w-full p-2 border rounded-md"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Planned">Planned</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    className="w-full p-2 border rounded-md"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    className="w-full p-2 border rounded-md"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="highPriority"
                      checked={formData.highPriority}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">High Priority</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="clients" className="text-sm font-medium">Clients</label>
                <MultiSelect
                  options={availableClients}
                  selected={formData.clients}
                  onChange={handleClientChange}
                  placeholder="Select clients..."
                  loading={clientsLoading}
                  icon={<Users className="h-4 w-4" />}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full p-2 border rounded-md"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter trip description"
                ></textarea>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full p-2 border rounded-md"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes"
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveTrip}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Trip
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For existing trip, show the details page
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            {trip.name}
            {trip.high_priority && (
              <AlertTriangle className="h-5 w-5 ml-2 text-amber-500" />
            )}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(trip.start_date), "MMM d, yyyy")} -{" "}
              {format(new Date(trip.end_date), "MMM d, yyyy")}
            </span>
          </div>
        </div>
        <Button onClick={() => setActiveTab("edit")}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Trip
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge className={getStatusBadgeStyle(trip.status)}>
          {trip.status}
        </Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="edit">Edit Trip</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Trip Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="font-medium">Dates: </span>
                        {format(new Date(trip.start_date), "MMM d, yyyy")} -{" "}
                        {format(new Date(trip.end_date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="font-medium">Duration: </span>
                        {Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                    {trip.high_priority && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">High Priority Trip</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Clients</h3>
                  {clients.length > 0 ? (
                    <ul className="space-y-2">
                      {clients.map((client) => (
                        <li
                          key={client.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{client.first_name} {client.last_name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No clients associated with this trip.</p>
                  )}
                </div>
              </div>
              
              {trip.description && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{trip.description}</p>
                </div>
              )}
              
              {trip.notes && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Notes</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{trip.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Trip Bookings</CardTitle>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/bookings/new?trip=${trip.id}`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Booking
              </Button>
            </CardHeader>
            <CardContent>
              {bookings.length > 0 ? (
                <div className="space-y-6">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="overflow-hidden">
                      <div className="flex flex-col cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/bookings/${booking.id}`)}>
                        <div className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{booking.vendor.name}</h3>
                            <Badge variant={booking.booking_status === "Confirmed" ? "default" : "outline"}>
                              {booking.booking_status}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.service_type?.name || "Service"}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(booking.start_date), "MMM d, yyyy")}
                                {booking.end_date && ` - ${format(new Date(booking.end_date), "MMM d, yyyy")}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No bookings associated with this trip yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate(`/bookings/new?trip=${trip.id}`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create a Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Trip</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Trip Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full p-2 border rounded-md"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">Status</label>
                    <select
                      id="status"
                      name="status"
                      className="w-full p-2 border rounded-md"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Planned">Planned</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      className="w-full p-2 border rounded-md"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      className="w-full p-2 border rounded-md"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="highPriority"
                        checked={formData.highPriority}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">High Priority</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="clients" className="text-sm font-medium">Clients</label>
                  <MultiSelect
                    options={availableClients}
                    selected={formData.clients}
                    onChange={handleClientChange}
                    placeholder="Select clients..."
                    loading={clientsLoading}
                    icon={<Users className="h-4 w-4" />}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="w-full p-2 border rounded-md"
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="w-full p-2 border rounded-md"
                    value={formData.notes}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSaveTrip}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TripDetailPage;
