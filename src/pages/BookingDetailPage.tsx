
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FilePlus2,
  Users,
  Briefcase,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Edit,
  Upload,
  Tag,
  User,
  Loader2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookingStatus, CommissionStatus, UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Define interfaces for our data structures
interface VendorType {
  id?: string;
  name: string;
  commissionRate: number;
  serviceTypes: any[];
}

interface AgentType {
  id?: string;
  name: string;
  email: string;
}

const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to convert time from 24-hour to 12-hour format
  const convertTo12HourFormat = (time24: string | null): string => {
    if (!time24) return "No specific time";
    
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Fetch booking data from Supabase
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          toast({
            title: "Error",
            description: "No booking ID provided",
            variant: "destructive"
          });
          navigate("/bookings");
          return;
        }
        
        // Fetch booking data
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*, service_type:service_type_id(name)')
          .eq('id', id)
          .single();
        
        if (bookingError) throw bookingError;
        if (!bookingData) {
          toast({
            title: "Booking not found",
            description: "The booking you're looking for doesn't exist",
            variant: "destructive"
          });
          navigate("/bookings");
          return;
        }
        
        // Set initial notes if available
        if (bookingData.notes) {
          setNotes(bookingData.notes);
        }
        
        // Fetch associated clients
        const { data: clientRelations, error: clientRelationsError } = await supabase
          .from('booking_clients')
          .select('client_id')
          .eq('booking_id', id);
        
        if (clientRelationsError) throw clientRelationsError;
        
        let clients = [];
        if (clientRelations && clientRelations.length > 0) {
          const clientIds = clientRelations.map(relation => relation.client_id);
          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('id, first_name, last_name')
            .in('id', clientIds);
          
          if (clientsError) throw clientsError;
          clients = clientsData || [];
        }
        
        // Fetch vendor data
        let vendor: VendorType = { name: "Unknown Vendor", commissionRate: 0, serviceTypes: [] };
        if (bookingData.vendor_id) {
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('id, name, commission_rate')
            .eq('id', bookingData.vendor_id)
            .single();
          
          if (vendorError) {
            console.error("Error fetching vendor:", vendorError);
          } else if (vendorData) {
            vendor = {
              id: vendorData.id,
              name: vendorData.name,
              commissionRate: vendorData.commission_rate,
              serviceTypes: []
            };
            
            // Fetch vendor service types
            const { data: vendorServiceTypes, error: vendorServiceTypesError } = await supabase
              .from('vendor_service_types')
              .select('service_type_id')
              .eq('vendor_id', vendorData.id);
            
            if (!vendorServiceTypesError && vendorServiceTypes) {
              const serviceTypeIds = vendorServiceTypes.map(vst => vst.service_type_id);
              const { data: serviceTypesData, error: serviceTypesError } = await supabase
                .from('service_types')
                .select('name')
                .in('id', serviceTypeIds);
              
              if (!serviceTypesError && serviceTypesData) {
                vendor.serviceTypes = serviceTypesData.map(st => st.name);
              }
            }
          }
        }
        
        // Fetch trip data if exists
        let trip = null;
        if (bookingData.trip_id) {
          const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('id, name, start_date, end_date')
            .eq('id', bookingData.trip_id)
            .single();
          
          if (!tripError && tripData) {
            trip = tripData;
          }
        }
        
        // Fetch agent data
        let agent: AgentType = { name: "Unknown Agent", email: "" };
        if (bookingData.agent_id) {
          const { data: agentData, error: agentError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', bookingData.agent_id)
            .single();
          
          if (!agentError && agentData) {
            agent = {
              id: bookingData.agent_id,
              name: `${agentData.first_name} ${agentData.last_name}`,
              email: agentData.email
            };
          }
        }
        
        // Fetch documents/files
        const { data: documents, error: documentsError } = await supabase
          .from('booking_files')
          .select('id, file_name, file_path, uploaded_at')
          .eq('booking_id', id);
        
        if (documentsError) {
          console.error("Error fetching booking files:", documentsError);
        }
        
        // Format time strings for display
        const formatTimeDisplay = (time: string | null): string => {
          if (!time) return "No specific time";
          return convertTo12HourFormat(time);
        };
        
        // Construct the complete booking object
        const completeBooking = {
          id: bookingData.id,
          clients: clients.map(client => ({ 
            id: client.id, 
            name: `${client.first_name} ${client.last_name}` 
          })),
          vendor,
          trip,
          serviceType: bookingData.service_type?.name || "Unknown Service",
          startDate: bookingData.start_date,
          startTime: formatTimeDisplay(bookingData.start_time),
          endDate: bookingData.end_date,
          endTime: formatTimeDisplay(bookingData.end_time),
          location: bookingData.location,
          cost: bookingData.cost,
          commissionRate: bookingData.commission_rate,
          commissionAmount: bookingData.commission_amount,
          bookingStatus: bookingData.booking_status as BookingStatus,
          isCompleted: bookingData.is_completed,
          commissionStatus: bookingData.commission_status as CommissionStatus,
          agent,
          documents: documents || [],
          notes: bookingData.notes
        };
        
        setBooking(completeBooking);
      } catch (error: any) {
        console.error("Error fetching booking details:", error);
        toast({
          title: "Error loading booking details",
          description: error.message || "There was an error loading the booking details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id, navigate, toast]);

  // Function to update notes
  const updateNotes = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ notes })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Notes updated",
        description: "Booking notes have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update notes",
        description: error.message || "There was an error updating the notes.",
        variant: "destructive"
      });
    }
  };

  // Function to get booking status badge styling
  const getBookingStatusBadgeStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Confirmed:
        return "bg-green-100 text-green-800";
      case BookingStatus.Pending:
        return "bg-yellow-100 text-yellow-800";
      case BookingStatus.Canceled:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get commission status badge styling
  const getCommissionStatusBadgeStyle = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.Received:
        return "bg-green-100 text-green-800";
      case CommissionStatus.Unreceived:
        return "bg-yellow-100 text-yellow-800";
      case CommissionStatus.Completed:
        return "bg-blue-100 text-blue-800";
      case CommissionStatus.Canceled:
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
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Booking not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <FilePlus2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{booking.serviceType} Booking</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge className={getBookingStatusBadgeStyle(booking.bookingStatus)}>
                {booking.bookingStatus}
              </Badge>
              <span>•</span>
              <Badge className={getCommissionStatusBadgeStyle(booking.commissionStatus)} variant="outline">
                {booking.commissionStatus}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/bookings/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Booking
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground mb-2">Client(s)</dt>
                <dd>
                  <div className="space-y-2">
                    {booking.clients.length > 0 ? (
                      booking.clients.map((client) => (
                        <div key={client.id} className="flex items-center rounded-md border px-3 py-2">
                          <Users className="h-4 w-4 text-muted-foreground mr-2" />
                          <span>{client.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No clients assigned</div>
                    )}
                  </div>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Vendor</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.vendor.name}</span>
                </dd>
              </div>

              {booking.trip && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Associated Trip</dt>
                  <dd className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.trip.name}</span>
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Service Type</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{booking.serviceType}</Badge>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Date & Time</dt>
                <dd>
                  <div className="rounded-md border p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Start</div>
                        <div>{new Date(booking.startDate).toLocaleDateString()}</div>
                        <div className="text-sm flex items-center mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                          <span className="text-muted-foreground">{booking.startTime}</span>
                        </div>
                      </div>
                    </div>
                  
                    {booking.endDate && (
                      <div className="flex items-start gap-2 pt-2 border-t">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">End</div>
                          <div>{new Date(booking.endDate).toLocaleDateString()}</div>
                          <div className="text-sm flex items-center mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                            <span className="text-muted-foreground">{booking.endTime}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                <dd className="flex items-start gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{booking.location}</span>
                </dd>
              </div>

              <div className="pt-2 border-t">
                <dt className="text-sm font-medium text-muted-foreground">Cost</dt>
                <dd className="text-lg font-medium mt-1">${booking.cost.toLocaleString()}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Commission Details</dt>
                <dd className="mt-1">
                  <div className="rounded-md border p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Rate</span>
                      <span>{booking.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="font-medium text-primary">${booking.commissionAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Booking Status</dt>
                <dd className="mt-1">
                  <div className="flex space-x-2">
                    <Button size="sm" variant={booking.bookingStatus === BookingStatus.Pending ? "default" : "outline"}>
                      Pending
                    </Button>
                    <Button size="sm" variant={booking.bookingStatus === BookingStatus.Confirmed ? "default" : "outline"}>
                      Confirmed
                    </Button>
                    <Button size="sm" variant={booking.bookingStatus === BookingStatus.Canceled ? "destructive" : "outline"}>
                      Canceled
                    </Button>
                  </div>
                </dd>
              </div>

              <RoleBasedComponent requiredRole={UserRole.Admin}>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Commission Status</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={booking.commissionStatus === CommissionStatus.Unreceived ? "default" : "outline"}>
                        Unreceived
                      </Button>
                      <Button size="sm" variant={booking.commissionStatus === CommissionStatus.Received ? "default" : "outline"}>
                        Received
                      </Button>
                      <Button size="sm" variant={booking.commissionStatus === CommissionStatus.Completed ? "default" : "outline"}>
                        Completed
                      </Button>
                      <Button size="sm" variant={booking.commissionStatus === CommissionStatus.Canceled ? "destructive" : "outline"}>
                        Canceled
                      </Button>
                    </div>
                  </dd>
                </div>
              </RoleBasedComponent>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Agent</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.agent.name}</span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 md:col-span-2">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[150px]"
                onBlur={updateNotes}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Documents</h3>
                <Button variant="ghost" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
              <div className="space-y-2">
                {booking.documents.length > 0 ? (
                  booking.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.file_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No documents uploaded yet.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingDetailPage;
