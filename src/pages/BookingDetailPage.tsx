
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
  Clock,
  DollarSign,
  Receipt,
  Star
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
import { BookingStatus, CommissionStatus, UserRole, BillingStatus } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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

  // Function to render rating as stars
  const renderRating = (rating: number = 0, color: string = "text-yellow-400") => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className={`h-4 w-4 ${color} fill-current`} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className={`h-4 w-4 ${color}`} />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-muted-foreground/30" />);
      }
    }

    return <div className="flex items-center space-x-1">{stars}</div>;
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
        
        // Fetch vendor data without commission_rate
        let vendor: VendorType = { name: "Unknown Vendor", commissionRate: 0, serviceTypes: [] };
        if (bookingData.vendor_id) {
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('id, name')
            .eq('id', bookingData.vendor_id)
            .single();
          
          if (vendorError) {
            console.error("Error fetching vendor:", vendorError);
          } else if (vendorData) {
            // Get commission rate from vendor_service_type_commissions table
            let commissionRate = 0;
            const { data: commissionData, error: commissionError } = await supabase
              .from('vendor_service_type_commissions')
              .select('commission_rate')
              .eq('vendor_id', vendorData.id)
              .eq('service_type_id', bookingData.service_type_id)
              .maybeSingle();
            
            if (!commissionError && commissionData) {
              commissionRate = commissionData.commission_rate;
            }
            
            vendor = {
              id: vendorData.id,
              name: vendorData.name,
              commissionRate: commissionRate,
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
        let subAgent: AgentType | null = null;
        
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

        // Fetch sub-agent data if exists
        if (bookingData.sub_agent_id) {
          const { data: subAgentData, error: subAgentError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', bookingData.sub_agent_id)
            .single();
          
          if (!subAgentError && subAgentData) {
            subAgent = {
              id: bookingData.sub_agent_id,
              name: `${subAgentData.first_name} ${subAgentData.last_name}`,
              email: subAgentData.email
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
          subAgent,
          documents: documents || [],
          notes: bookingData.notes,
          billingStatus: bookingData.billing_status as BillingStatus || BillingStatus.Draft,
          depositAmount: bookingData.deposit_amount,
          finalPaymentDueDate: bookingData.final_payment_due_date,
          rating: bookingData.rating,
          clientRating: bookingData.client_rating
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

  // Function to get billing status badge styling
  const getBillingStatusBadgeStyle = (status: BillingStatus) => {
    switch (status) {
      case BillingStatus.Paid:
        return "bg-green-100 text-green-800";
      case BillingStatus.AwaitingDeposit:
      case BillingStatus.AwaitingFinalPayment:
        return "bg-yellow-100 text-yellow-800";
      case BillingStatus.Draft:
        return "bg-blue-100 text-blue-800";
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
              {booking.billingStatus && (
                <>
                  <span>•</span>
                  <Badge className={getBillingStatusBadgeStyle(booking.billingStatus)} variant="outline">
                    {booking.billingStatus}
                  </Badge>
                </>
              )}
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
      
      {/* Two Column Layout matching BookingForm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Booking Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>Basic information for this booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Clients</div>
                <div className="space-y-2">
                  {booking.clients.length > 0 ? (
                    booking.clients.map((client: any) => (
                      <div key={client.id} className="flex items-center rounded-md border px-3 py-2">
                        <Users className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>{client.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No clients assigned</div>
                  )}
                </div>
              </div>

              {/* Vendor */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Vendor</div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.vendor.name}</span>
                </div>
              </div>

              {/* Service Type */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Service Type</div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{booking.serviceType}</Badge>
                </div>
              </div>

              {/* Trip */}
              {booking.trip && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Associated Trip</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.trip.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Agent Section */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Agent</CardTitle>
              <CardDescription>Agent information for this booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Agent */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Primary Agent</div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.agent.name}</span>
                </div>
              </div>

              {/* Sub-Agent */}
              {booking.subAgent && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Sub-Agent</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.subAgent.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Date & Time</CardTitle>
              <CardDescription>Date and time for this booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Start Date & Time */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Start Date & Time</div>
                <div className="rounded-md border p-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div>{new Date(booking.startDate).toLocaleDateString()}</div>
                      <div className="text-sm flex items-center mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                        <span className="text-muted-foreground">{booking.startTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              {booking.endDate && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">End Date & Time</div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div>{new Date(booking.endDate).toLocaleDateString()}</div>
                        <div className="text-sm flex items-center mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                          <span className="text-muted-foreground">{booking.endTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location & Details</CardTitle>
              <CardDescription>Additional booking information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Location</div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{booking.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Billing, Commission & Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>Payment and billing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cost */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Cost</div>
                <div className="text-lg font-medium">${booking.cost.toLocaleString()}</div>
              </div>

              {/* Billing Status */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Billing Status</div>
                <Badge className={getBillingStatusBadgeStyle(booking.billingStatus)} variant="outline">
                  {booking.billingStatus || BillingStatus.Draft}
                </Badge>
              </div>

              {/* Deposit Amount */}
              {booking.depositAmount !== null && booking.depositAmount !== undefined && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Deposit Amount</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${booking.depositAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Final Payment Due Date */}
              {booking.finalPaymentDueDate && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Final Payment Due Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(booking.finalPaymentDueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commission Details</CardTitle>
              <CardDescription>Financial details and commission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Commission Rate */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Commission Rate (%)</div>
                <div>{booking.commissionRate}%</div>
              </div>

              {/* Commission Amount */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Commission Amount</div>
                <div className="font-medium text-primary">${booking.commissionAmount.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
              <CardDescription>Booking and commission status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Booking Status */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Booking Status</div>
                <Badge className={getBookingStatusBadgeStyle(booking.bookingStatus)}>
                  {booking.bookingStatus}
                </Badge>
              </div>

              {/* Commission Status */}
              <RoleBasedComponent requiredRole={UserRole.Admin}>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Commission Status</div>
                  <Badge className={getCommissionStatusBadgeStyle(booking.commissionStatus)} variant="outline">
                    {booking.commissionStatus}
                  </Badge>
                </div>
              </RoleBasedComponent>

              {/* Completion Status */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Completion Status</div>
                <Badge variant={booking.isCompleted ? "default" : "secondary"}>
                  {booking.isCompleted ? "Completed" : "Not Completed"}
                </Badge>
              </div>

              {/* Vendor Rating */}
              {booking.rating && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Vendor Rating</div>
                  {renderRating(booking.rating, "text-yellow-500")}
                </div>
              )}

              {/* Client Rating */}
              {booking.clientRating && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Client Rating</div>
                  {renderRating(booking.clientRating, "text-blue-500")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Notes and Documents Section - Full Width */}
      <Card>
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
                booking.documents.map((doc: any) => (
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
  );
};

export default BookingDetailPage;
