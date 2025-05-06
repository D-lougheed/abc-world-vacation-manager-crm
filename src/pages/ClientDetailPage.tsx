import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Calendar,
  FileText,
  Clock,
  Upload,
  CalendarCheck,
  FilePlus2,
  Edit,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  X,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isNewClient = id === "new";
  const [loading, setLoading] = useState(isNewClient ? false : true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(isNewClient); // Edit mode enabled by default for new clients
  const [notes, setNotes] = useState("");
  const [client, setClient] = useState<any>(null);
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [documents, setDocuments] = useState([]);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  // Fetch client data if this is not a new client
  useEffect(() => {
    if (!isNewClient) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clientError) throw clientError;
      
      setClient({
        id: clientData.id,
        firstName: clientData.first_name,
        lastName: clientData.last_name,
        dateCreated: clientData.date_created,
        lastUpdated: clientData.last_updated,
        notes: clientData.notes || "",
      });
      
      form.reset({
        firstName: clientData.first_name,
        lastName: clientData.last_name,
      });

      setNotes(clientData.notes || "");

      // Fetch trips for this client
      const { data: tripsData, error: tripsError } = await supabase
        .from('trip_clients')
        .select(`
          trip_id,
          trips:trip_id (
            id,
            name,
            start_date,
            end_date,
            status
          )
        `)
        .eq('client_id', id);
      
      if (tripsError) throw tripsError;
      
      setTrips(tripsData.map(item => item.trips) || []);

      // Fetch bookings for this client
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('booking_clients')
        .select(`
          booking_id,
          bookings:booking_id (
            id,
            service_type_id,
            vendor_id,
            start_date,
            end_date,
            cost,
            booking_status,
            location,
            vendors:vendor_id (
              name
            )
          )
        `)
        .eq('client_id', id);
      
      if (bookingsError) throw bookingsError;
      
      const formattedBookings = bookingsData.map(item => ({
        id: item.bookings.id,
        name: `Booking for ${item.bookings.location || "Unknown Location"}`,
        service: `Service at ${item.bookings.location || "Unknown Location"}`,
        vendor: item.bookings.vendors?.name || "Unknown Vendor",
        startDate: item.bookings.start_date,
        endDate: item.bookings.end_date,
        cost: item.bookings.cost,
        status: item.bookings.booking_status
      }));
      
      setBookings(formattedBookings);

      // Fetch documents for this client
      const { data: documentsData, error: documentsError } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', id);
      
      if (documentsError) throw documentsError;
      
      const formattedDocuments = (documentsData || []).map(doc => ({
        id: doc.id,
        name: doc.file_name,
        uploadDate: doc.uploaded_at
      }));
      
      setDocuments(formattedDocuments);
    } catch (error: any) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Failed to load client",
        description: error.message || "There was an error loading client data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: any) => {
    try {
      setSaving(true);
      
      const clientData = {
        first_name: values.firstName,
        last_name: values.lastName,
        notes: notes
      };

      let result;
      
      if (isNewClient) {
        // Create new client
        result = await supabase
          .from('clients')
          .insert(clientData)
          .select();
        
        if (result.error) throw result.error;
        
        toast({
          title: "Client created",
          description: "New client has been created successfully"
        });
        
        // Redirect to the new client's page
        navigate(`/clients/${result.data[0].id}`);
      } else {
        // Update existing client
        result = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', id)
          .select();
        
        if (result.error) throw result.error;
        
        toast({
          title: "Client updated",
          description: "Client information has been updated successfully"
        });
        
        // Exit edit mode and refresh client data
        setEditMode(false);
        fetchClientData();
      }
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: "Failed to save client",
        description: error.message || "There was an error saving client data",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!isNewClient) {
      // Reset form to current client values
      form.reset({
        firstName: client?.firstName,
        lastName: client?.lastName,
      });
      setNotes(client?.notes || "");
      setEditMode(false);
    } else {
      // Navigate back to clients list
      navigate('/clients');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading client data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="rounded-full bg-primary/10 p-3">
            <User className="h-6 w-6 text-primary" />
          </div>
          {isNewClient ? (
            <h1 className="text-3xl font-bold">New Client</h1>
          ) : (
            <div>
              <h1 className="text-3xl font-bold">{client?.firstName} {client?.lastName}</h1>
              <p className="text-sm text-muted-foreground">Client since {new Date(client?.dateCreated).toLocaleDateString()}</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isNewClient && !editMode && (
            <Button onClick={() => setEditMode(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
          )}
          {!isNewClient && (
            <>
              <Button variant="outline" onClick={() => navigate(`/trips/new?clientId=${id}`)}>
                <CalendarCheck className="mr-2 h-4 w-4" />
                New Trip
              </Button>
              <Button onClick={() => navigate(`/bookings/new?clientId=${id}`)}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                New Booking
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter first name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter last name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!isNewClient && (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Client Since</Label>
                        <div>{new Date(client?.dateCreated).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                        <div>{new Date(client?.lastUpdated).toLocaleDateString()}</div>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px] mt-1"
                      placeholder="Add client notes here..."
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isNewClient ? "Create Client" : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">First Name</Label>
                  <p className="mt-1">{client?.firstName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Name</Label>
                  <p className="mt-1">{client?.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Client Since</Label>
                  <p className="mt-1">{new Date(client?.dateCreated).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="mt-1">{new Date(client?.lastUpdated).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="mt-1 whitespace-pre-wrap">{client?.notes || "No notes available."}</p>
                </div>
              </div>
            )}
            
            {!isNewClient && !editMode && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Documents</span>
                  <Button variant="ghost" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
                <div className="space-y-2">
                  {documents.length > 0 ? (
                    documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{doc.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground text-sm">
                      No documents uploaded yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {!isNewClient && (
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
                    {trips.length > 0 ? (
                      trips.map((trip: any) => (
                        <div 
                          key={trip.id} 
                          className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/trips/${trip.id}`)}
                        >
                          <div>
                            <p className="font-medium">{trip.name}</p>
                            <div className="text-sm text-muted-foreground">
                              {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              trip.status === "Completed" ? "bg-green-100 text-green-800" : 
                              trip.status === "Planned" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {trip.status}
                            </span>
                            <Button variant="ghost" size="icon" onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/trips/${trip.id}`);
                            }}>
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
                    {bookings.length > 0 ? (
                      bookings.map((booking: any) => (
                        <div 
                          key={booking.id} 
                          className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                        >
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
                            <Button variant="ghost" size="icon" onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/bookings/${booking.id}`);
                            }}>
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
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;
