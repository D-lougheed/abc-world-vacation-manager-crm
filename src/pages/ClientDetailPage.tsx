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
import { useAuth } from "@/contexts/AuthContext";
import { addAuditLog } from "@/services/AuditLogService";

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
  const [client, setClient] = useState<any>(null); // This stores the original client data for comparison on update
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const { user: currentUser } = useAuth();

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  // Fetch client data if this is not a new client
  useEffect(() => {
    if (!isNewClient && id) {
      fetchClientData(id);
    }
  }, [id, isNewClient]);

  const fetchClientData = async (clientId: string) => {
    try {
      setLoading(true);
      
      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (clientError) throw clientError;
      
      const fetchedClient = {
        id: clientData.id,
        firstName: clientData.first_name,
        lastName: clientData.last_name,
        dateCreated: clientData.date_created,
        lastUpdated: clientData.last_updated,
        notes: clientData.notes || "",
      };
      setClient(fetchedClient);
      
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
        .eq('client_id', clientId);
      
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
        .eq('client_id', clientId);
      
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
        .eq('client_id', clientId);
      
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
    // Define submittedDataForAudit here to make it accessible in the catch block
    const submittedDataForAudit = {
      first_name: values.firstName,
      last_name: values.lastName,
      notes: notes,
    };

    try {
      setSaving(true);
      
      // This clientPayload is for the actual Supabase operation
      const clientPayloadForSupabase = {
        first_name: values.firstName,
        last_name: values.lastName,
        notes: notes
      };

      let result;
      
      if (isNewClient) {
        result = await supabase
          .from('clients')
          .insert(clientPayloadForSupabase)
          .select()
          .single();
        
        if (result.error) throw result.error;
        
        const newClientRecord = result.data;
        toast({
          title: "Client created",
          description: "New client has been created successfully"
        });
        
        if (currentUser && newClientRecord) {
          await addAuditLog(currentUser, {
            action: 'CREATE_CLIENT',
            resourceType: 'Client',
            resourceId: newClientRecord.id,
            details: { clientData: { ...submittedDataForAudit, id: newClientRecord.id } },
          });
        }
        
        navigate(`/clients/${newClientRecord.id}`);
      } else {
        if (!id) {
          toast({ title: "Error", description: "Client ID is missing for update.", variant: "destructive" });
          setSaving(false);
          return;
        }
        result = await supabase
          .from('clients')
          .update(clientPayloadForSupabase)
          .eq('id', id)
          .select()
          .single();
        
        if (result.error) throw result.error;
        
        const updatedClientRecord = result.data;
        toast({
          title: "Client updated",
          description: "Client information has been updated successfully"
        });
        
        if (currentUser && updatedClientRecord && client) { // ensure client (old values) exists
          await addAuditLog(currentUser, {
            action: 'UPDATE_CLIENT',
            resourceType: 'Client',
            resourceId: updatedClientRecord.id,
            details: { 
              oldValues: { 
                first_name: client.firstName, 
                last_name: client.lastName, 
                notes: client.notes 
              }, 
              newValues: { ...submittedDataForAudit, id: updatedClientRecord.id, dateCreated: client.dateCreated, last_updated: updatedClientRecord.last_updated } 
            },
          });
        }
        
        setEditMode(false);
        fetchClientData(id); // Refetch data to update the view and client state
      }
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: "Failed to save client",
        description: error.message || "There was an error saving client data",
        variant: "destructive"
      });
      if (currentUser) {
        await addAuditLog(currentUser, {
          action: isNewClient ? 'CREATE_CLIENT_FAILED' : 'UPDATE_CLIENT_FAILED',
          resourceType: 'Client',
          resourceId: id || null,
          details: { error: error.message, submittedData: submittedDataForAudit },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!isNewClient) {
      form.reset({
        firstName: client?.firstName,
        lastName: client?.lastName,
      });
      setNotes(client?.notes || "");
      setEditMode(false);
    } else {
      navigate('/clients');
    }
  };

  if (loading && !isNewClient) {
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
              <p className="text-sm text-muted-foreground">Client since {client?.dateCreated ? new Date(client.dateCreated).toLocaleDateString() : 'N/A'}</p>
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
          {!isNewClient && id && (
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
                    rules={{ required: "First name is required" }}
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
                    rules={{ required: "Last name is required" }}
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
                  
                  {!isNewClient && client && (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Client Since</Label>
                        <div>{new Date(client.dateCreated).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                        <div>{new Date(client.lastUpdated).toLocaleDateString()}</div>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <Label htmlFor="client-notes" className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <Textarea
                      id="client-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[100px] mt-1"
                      placeholder="Add client notes here..."
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1" disabled={saving || !form.formState.isValid}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isNewClient ? "Create Client" : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1" disabled={saving}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              client && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">First Name</Label>
                    <p className="mt-1">{client.firstName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Name</Label>
                    <p className="mt-1">{client.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Client Since</Label>
                    <p className="mt-1">{new Date(client.dateCreated).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="mt-1">{new Date(client.lastUpdated).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="mt-1 whitespace-pre-wrap">{client.notes || "No notes available."}</p>
                  </div>
                </div>
              )
            )}
            
            {!isNewClient && !editMode && client && (
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
        
        {!isNewClient && client && (
          <Card className="col-span-3 md:col-span-2">
            <Tabs defaultValue="trips">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Travel History</CardTitle>
                  <TabsList>
                    <TabsTrigger value="trips">
                      <Calendar className="mr-2 h-4 w-4" />
                      Trips ({trips.length})
                    </TabsTrigger>
                    <TabsTrigger value="bookings">
                      <Clock className="mr-2 h-4 w-4" />
                      Bookings ({bookings.length})
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
