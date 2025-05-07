import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Calendar, 
  CreditCard, 
  User, 
  Briefcase, 
  MapPin, 
  Percent,
  Users,
  Clock,
  Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BookingStatus, CommissionStatus, UserRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "./MultiSelect";
import { useAuth } from "@/contexts/AuthContext";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Time validation regex - format for 12-hour time with AM/PM
// Matches patterns like "1:30 PM", "12:45 AM", "3:05 pm", etc.
const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM|am|pm)$/;

// Schema for form validation
const bookingSchema = z.object({
  clients: z.array(z.string()).min(1, { message: "At least one client must be selected" }),
  vendor: z.string({ required_error: "Vendor is required" }),
  serviceType: z.string({ required_error: "Service type is required" }),
  startDate: z.date({ required_error: "Start date is required" }),
  startTime: z.string()
    .refine(val => val === "" || timeRegex.test(val), {
      message: "Time must be in format HH:MM AM/PM (e.g. 2:30 PM)",
    })
    .optional(),
  endDate: z.date().optional(),
  endTime: z.string()
    .refine(val => val === "" || timeRegex.test(val), {
      message: "Time must be in format HH:MM AM/PM (e.g. 2:30 PM)",
    })
    .optional(),
  location: z.string().min(1, { message: "Location is required" }),
  cost: z.number().positive({ message: "Cost must be a positive number" }),
  commissionRate: z.number().min(0, { message: "Commission rate cannot be negative" }),
  notes: z.string().optional().nullable(),
  bookingStatus: z.enum(["Pending", "Confirmed", "Canceled"]),
  commissionStatus: z.enum(["Unreceived", "Received", "Canceled", "Completed"]),
  isCompleted: z.boolean().default(false),
  tripId: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).optional(),
  agentId: z.string().nullable().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  initialData?: BookingFormValues;
  bookingId?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// Helper function to format time for display
const formatTimeForDisplay = (timeString: string | null | undefined): string => {
  if (!timeString) return "";
  return timeString;
};

// Helper function to generate time options
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, "0");
      const minuteStr = minute.toString().padStart(2, "0");
      const timeStr = `${hourStr}:${minuteStr}`;
      options.push({ value: timeStr, label: timeStr });
    }
  }
  return options;
};

// Helper function to convert 12-hour format to 24-hour format for database storage
const convertTo24HourFormat = (time12: string | null | undefined): string | null => {
  if (!time12) return null;
  
  // Normalize the time format
  const normalizedTime = time12.trim().toUpperCase();
  
  // Extract hours, minutes, and period (AM/PM)
  const match = normalizedTime.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3];
  
  // Convert hours based on period
  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  // Format hours and minutes properly
  const formattedHours = hours.toString().padStart(2, '0');
  
  return `${formattedHours}:${minutes}`;
};

const BookingForm = ({ initialData, bookingId }: BookingFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, checkUserAccess } = useAuth();
  const isAdmin = checkUserAccess(UserRole.Admin);
  
  // State for dropdown options
  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<SelectOption[]>([]);
  const [allServiceTypeOptions, setAllServiceTypeOptions] = useState<SelectOption[]>([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<SelectOption[]>([]);
  const [tripOptions, setTripOptions] = useState<SelectOption[]>([]);
  const [agentOptions, setAgentOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVendorCommissionRate, setSelectedVendorCommissionRate] = useState<number | null>(null);
  const timeOptions = generateTimeOptions();

  // Add debug state to help troubleshoot form submission
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Default values for the form
  const defaultValues: Partial<BookingFormValues> = {
    clients: initialData?.clients || [],
    vendor: initialData?.vendor || "",
    serviceType: initialData?.serviceType || "",
    startDate: initialData?.startDate || new Date(),
    startTime: initialData?.startTime || "",
    endDate: initialData?.endDate || undefined,
    endTime: initialData?.endTime || "",
    location: initialData?.location || "",
    cost: initialData?.cost || 0,
    commissionRate: initialData?.commissionRate || 10,
    notes: initialData?.notes || "",
    bookingStatus: initialData?.bookingStatus || BookingStatus.Pending, // Default to Pending
    commissionStatus: initialData?.commissionStatus || CommissionStatus.Unreceived, // Default to Unreceived
    isCompleted: initialData?.isCompleted || false,
    tripId: initialData?.tripId || undefined,
    rating: initialData?.rating || 0,
    agentId: initialData?.agentId || user?.id || null,
  };

  // Initialize react-hook-form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: initialData || defaultValues,
    mode: "onSubmit", // Ensure validation runs on submit
  });
  
  const watchCost = form.watch("cost");
  const watchCommissionRate = form.watch("commissionRate");
  const commissionAmount = (watchCost * watchCommissionRate) / 100;
  
  // Watch the vendor selection to update service types and commission rate
  const selectedVendor = form.watch("vendor");
  const currentRating = form.watch("rating") || 0;
  
  // Fetch all necessary data from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        
        // Fetch clients
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, first_name, last_name')
          .order('last_name');
          
        if (clientsError) throw clientsError;
        
        // Fetch vendors
        const { data: vendors, error: vendorsError } = await supabase
          .from('vendors')
          .select('id, name, commission_rate')
          .order('name');
          
        if (vendorsError) throw vendorsError;
        
        // Fetch service types
        const { data: serviceTypes, error: serviceTypesError } = await supabase
          .from('service_types')
          .select('id, name')
          .order('name');
          
        if (serviceTypesError) throw serviceTypesError;
        
        // Fetch trips - for agents, only show their own trips
        let tripsQuery = supabase
          .from('trips')
          .select('id, name');
          
        // If not admin, filter by current user's ID
        if (!isAdmin && user) {
          tripsQuery = tripsQuery.eq('agent_id', user.id);
        }
        
        // Order by start date descending
        const { data: trips, error: tripsError } = await tripsQuery.order('start_date', { ascending: false });
          
        if (tripsError) throw tripsError;

        // Fetch agents if admin
        if (isAdmin) {
          const { data: agents, error: agentsError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .order('last_name');
            
          if (agentsError) throw agentsError;
          
          setAgentOptions(agents.map(agent => ({
            value: agent.id,
            label: `${agent.first_name} ${agent.last_name}`
          })));
        }
        
        // Format data for dropdowns
        setClientOptions(clients.map(client => ({
          value: client.id,
          label: `${client.first_name} ${client.last_name}`
        })));
        
        setVendorOptions(vendors.map(vendor => ({
          value: vendor.id,
          label: vendor.name
        })));
        
        setAllServiceTypeOptions(serviceTypes.map(type => ({
          value: type.id,
          label: type.name
        })));
        
        // Store all service types initially
        setServiceTypeOptions(serviceTypes.map(type => ({
          value: type.id,
          label: type.name
        })));
        
        setTripOptions([
          { value: "no_trip", label: "No Trip" },
          ...trips.map(trip => ({
            value: trip.id,
            label: trip.name
          }))
        ]);

      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to load data: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [toast, isAdmin, user]);

  // If editing an existing booking, fetch its data
  useEffect(() => {
    if (bookingId) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          
          // Fetch booking data
          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();
            
          if (bookingError) throw bookingError;
          
          // Fetch associated clients
          const { data: bookingClients, error: bookingClientsError } = await supabase
            .from('booking_clients')
            .select('client_id')
            .eq('booking_id', bookingId);
            
          if (bookingClientsError) throw bookingClientsError;
          
          const clientIds = bookingClients.map(relation => relation.client_id);
          
          // Convert time to 12-hour format if needed
          const convertTo12HourFormat = (time24: string | null): string => {
            if (!time24) return "";
            
            const [hours, minutes] = time24.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
            
            return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
          };
          
          // Set form values
          form.reset({
            clients: clientIds,
            vendor: booking.vendor_id,
            serviceType: booking.service_type_id,
            startDate: new Date(booking.start_date),
            startTime: booking.start_time ? convertTo12HourFormat(booking.start_time) : "",
            endDate: booking.end_date ? new Date(booking.end_date) : undefined,
            endTime: booking.end_time ? convertTo12HourFormat(booking.end_time) : "",
            location: booking.location,
            cost: booking.cost,
            commissionRate: booking.commission_rate,
            notes: booking.notes || "",
            bookingStatus: booking.booking_status,
            commissionStatus: booking.commission_status,
            isCompleted: booking.is_completed,
            tripId: booking.trip_id || "no_trip",
            rating: booking.rating || 0,
          });
          
        } catch (error: any) {
          toast({
            title: "Error",
            description: `Failed to load booking: ${error.message}`,
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };

      fetchBooking();
    }
  }, [bookingId, form, toast]);

  // Update service types and commission rate when vendor changes
  useEffect(() => {
    if (selectedVendor) {
      const fetchVendorDetails = async () => {
        try {
          setLoading(true);
          
          // Fetch vendor's commission rate
          const { data: vendor, error: vendorError } = await supabase
            .from('vendors')
            .select('commission_rate')
            .eq('id', selectedVendor)
            .single();
            
          if (vendorError) throw vendorError;
          
          // Set the commission rate from vendor
          if (vendor) {
            setSelectedVendorCommissionRate(vendor.commission_rate);
            form.setValue('commissionRate', vendor.commission_rate);
          }
          
          // Fetch vendor's service types
          const { data: vendorServiceTypes, error: serviceTypesError } = await supabase
            .from('vendor_service_types')
            .select('service_type_id')
            .eq('vendor_id', selectedVendor);
            
          if (serviceTypesError) throw serviceTypesError;
          
          if (vendorServiceTypes && vendorServiceTypes.length > 0) {
            // Filter service types to only those offered by the vendor
            const vendorServiceTypeIds = vendorServiceTypes.map(st => st.service_type_id);
            const filteredServiceTypes = allServiceTypeOptions.filter(
              option => vendorServiceTypeIds.includes(option.value)
            );
            
            setServiceTypeOptions(filteredServiceTypes);
            
            // Clear the selected service type if it's not in the filtered list
            const currentServiceType = form.getValues('serviceType');
            if (currentServiceType && !vendorServiceTypeIds.includes(currentServiceType)) {
              form.setValue('serviceType', '');
            }
          } else {
            // If vendor has no specific service types, show all of them
            setServiceTypeOptions(allServiceTypeOptions);
          }
          
        } catch (error: any) {
          toast({
            title: "Error",
            description: `Failed to load vendor details: ${error.message}`,
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchVendorDetails();
    } else {
      // Reset to all service types when no vendor is selected
      setServiceTypeOptions(allServiceTypeOptions);
      setSelectedVendorCommissionRate(null);
    }
  }, [selectedVendor, allServiceTypeOptions, form, toast]);
  
  // Handle star rating click
  const handleRatingClick = (rating: number) => {
    form.setValue('rating', rating);
  };

  // Handle form submission
  const onSubmit = async (values: BookingFormValues) => {
    try {
      console.log("Form submission started", values);
      setFormSubmitting(true);
      setLoading(true);
      
      // Calculate commission amount based on cost and rate
      const commissionAmount = (values.cost * values.commissionRate) / 100;
      
      // Convert times to 24-hour format for database storage
      const start_time = convertTo24HourFormat(values.startTime);
      const end_time = convertTo24HourFormat(values.endTime);
      
      // Get current user (agent)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to create a booking.");
      }
      
      // Handle the "no_trip" special value
      const tripId = values.tripId === "no_trip" ? null : values.tripId;
      
      // Use the agentId from form or fallback to current user
      const agentId = values.agentId || user.id;
      
      let newBookingId = bookingId;
      
      // Insert or update booking
      if (bookingId) {
        // Update existing booking
        console.log("Updating booking with ID:", bookingId);
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            vendor_id: values.vendor,
            service_type_id: values.serviceType,
            start_date: values.startDate.toISOString().split('T')[0],
            start_time: start_time,
            end_date: values.endDate ? values.endDate.toISOString().split('T')[0] : null,
            end_time: end_time,
            location: values.location,
            cost: values.cost,
            commission_rate: values.commissionRate,
            commission_amount: commissionAmount,
            booking_status: values.bookingStatus || 'Pending', // Ensure default value
            commission_status: values.commissionStatus || 'Unreceived', // Ensure default value
            is_completed: values.isCompleted,
            notes: values.notes || null,
            trip_id: tripId,
            rating: values.rating || null,
            agent_id: agentId,
          })
          .eq('id', bookingId);
          
        if (updateError) {
          console.error("Error updating booking:", updateError);
          throw updateError;
        }
        
        console.log("Booking updated successfully, now handling client relations");
        
        // Delete existing client relations and insert new ones
        const { error: deleteError } = await supabase
          .from('booking_clients')
          .delete()
          .eq('booking_id', bookingId);
          
        if (deleteError) {
          console.error("Error deleting client relations:", deleteError);
          throw deleteError;
        }
        
        // After deleting, wait a brief moment to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Only now insert the new client relationships
        if (values.clients.length > 0) {
          const clientRelations = values.clients.map(clientId => ({
            booking_id: bookingId,
            client_id: clientId
          }));
          
          console.log("Inserting client relations for existing booking:", clientRelations);
          
          const { error: clientsError } = await supabase
            .from('booking_clients')
            .insert(clientRelations);
          
          if (clientsError) {
            console.error("Error inserting client relations:", clientsError);
            throw clientsError;
          }
        }
        
      } else {
        // Insert new booking
        console.log("Creating new booking with data:", {
          vendor_id: values.vendor,
          service_type_id: values.serviceType,
          start_date: values.startDate.toISOString().split('T')[0],
          start_time: start_time,
          end_date: values.endDate ? values.endDate.toISOString().split('T')[0] : null,
          end_time: end_time,
          location: values.location,
          cost: values.cost,
          commission_rate: values.commissionRate,
          commission_amount: commissionAmount,
          booking_status: values.bookingStatus || 'Pending', // Ensure default value
          commission_status: values.commissionStatus || 'Unreceived', // Ensure default value
          is_completed: values.isCompleted,
          notes: values.notes || null,
          trip_id: tripId,
          agent_id: agentId,
          rating: values.rating || null,
        });

        const { data: newBooking, error: insertError } = await supabase
          .from('bookings')
          .insert({
            vendor_id: values.vendor,
            service_type_id: values.serviceType,
            start_date: values.startDate.toISOString().split('T')[0],
            start_time: start_time,
            end_date: values.endDate ? values.endDate.toISOString().split('T')[0] : null,
            end_time: end_time,
            location: values.location,
            cost: values.cost,
            commission_rate: values.commissionRate,
            commission_amount: commissionAmount,
            booking_status: values.bookingStatus || 'Pending', 
            commission_status: values.commissionStatus || 'Unreceived',
            is_completed: values.isCompleted,
            notes: values.notes || null,
            trip_id: tripId,
            agent_id: agentId,
            rating: values.rating || null,
          })
          .select('id')
          .single();
          
        if (insertError) {
          console.error("Error inserting booking:", insertError);
          throw insertError;
        }
        
        if (!newBooking) {
          console.error("No booking ID returned after insert");
          throw new Error("Failed to create booking - no ID returned");
        }
        
        newBookingId = newBooking.id;
        console.log("New booking created with ID:", newBookingId);
      
        // For new bookings, insert client relations
        if (newBookingId && values.clients.length > 0) {
          const clientRelations = values.clients.map(clientId => ({
            booking_id: newBookingId,
            client_id: clientId
          }));
          
          console.log("Inserting client relations for new booking:", clientRelations);
          
          const { error: clientsError } = await supabase
            .from('booking_clients')
            .insert(clientRelations);
            
          if (clientsError) {
            console.error("Error inserting client relations:", clientsError);
            throw clientsError;
          }
        }
      }
      
      // If the booking is completed and has a rating, update the vendor's rating
      if (values.isCompleted && values.bookingStatus === 'Confirmed' && values.rating && values.rating > 0) {
        try {
          // Call the update-vendor-ratings edge function
          const { data: ratingData, error: ratingError } = await supabase.functions.invoke('update-vendor-ratings', {
            body: { vendor_id: values.vendor }
          });
          
          if (ratingError) {
            console.error("Failed to update vendor rating:", ratingError);
          } else {
            console.log("Vendor rating updated:", ratingData);
          }
        } catch (ratingUpdateError) {
          console.error("Error calling rating update function:", ratingUpdateError);
        }
      }
      
      toast({
        title: "Success",
        description: `Booking successfully ${bookingId ? 'updated' : 'created'}.`,
      });
      
      navigate(`/bookings/${newBookingId}`);
      
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: `Failed to ${bookingId ? 'update' : 'create'} booking: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setFormSubmitting(false);
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      title: "Validation Error",
      description: "Please check the form for errors and try again.",
      variant: "destructive"
    });
  };

  // Handle cancellation
  const onCancel = () => {
    if (bookingId) {
      navigate(`/bookings/${bookingId}`);
    } else {
      navigate("/bookings");
    }
  };

  const getStatusBadgeStyle = (status: BookingStatus | CommissionStatus) => {
    switch (status) {
      case BookingStatus.Confirmed:
      case CommissionStatus.Received:
      case CommissionStatus.Completed:
        return "bg-green-100 text-green-800";
      case BookingStatus.Pending:
      case CommissionStatus.Unreceived:
        return "bg-yellow-100 text-yellow-800";
      case BookingStatus.Canceled:
      case CommissionStatus.Canceled:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    // Log form values whenever they change significantly
    const subscription = form.watch((value) => {
      console.log("Form values updated:", value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="clients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clients</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={clientOptions}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select clients..."
                          icon={<Users className="h-4 w-4" />}
                          loading={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Add Agent field - only editable for admins */}
                <RoleBasedComponent requiredRole={UserRole.Admin}>
                  <FormField
                    control={form.control}
                    name="agentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Agent</FormLabel>
                        <Select 
                          disabled={loading} 
                          onValueChange={field.onChange}
                          defaultValue={field.value || (user?.id as string)}
                          value={field.value || (user?.id as string)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an agent" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {agentOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Assign this booking to an agent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </RoleBasedComponent>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor</FormLabel>
                        <Select 
                          disabled={loading} 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset service type when vendor changes
                            form.setValue('serviceType', '');
                          }}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a vendor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vendorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select 
                          disabled={loading || serviceTypeOptions.length === 0 || !selectedVendor}
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedVendor ? "Select service type" : "Select a vendor first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="tripId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip (optional)</FormLabel>
                      <Select 
                        disabled={loading} 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || "no_trip"}
                        value={field.value || "no_trip"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a trip (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tripOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Associate this booking with a trip (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="e.g., Paris, France" 
                            className="pl-9" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="HH:MM AM/PM (e.g. 2:30 PM)" 
                                className="pl-9" 
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Use 12-hour format with AM/PM (e.g., 2:30 PM)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date (optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < form.getValues("startDate")
                                }
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="HH:MM AM/PM (e.g. 4:30 PM)" 
                                className="pl-9" 
                                disabled={!form.getValues("endDate")}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Use 12-hour format with AM/PM (e.g., 4:30 PM)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes about this booking..." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          className="pl-9" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Rate (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          className="pl-9"
                          disabled={true} // Disabled because it comes from the vendor
                          value={field.value}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Commission rate is automatically set based on the selected vendor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">Commission Amount</p>
                <p className="text-2xl font-bold">${commissionAmount.toFixed(2)}</p>
              </div>
              
              {/* Rating Field - Only shown for completed bookings */}
              {form.watch("isCompleted") && form.watch("bookingStatus") === "Confirmed" && (
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1-5 stars)</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRatingClick(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= currentRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Rate your experience with this vendor (1-5 stars)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="bookingStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Status</FormLabel>
                    <Select 
                      disabled={loading} 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(BookingStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center">
                              <Badge className={getStatusBadgeStyle(status as BookingStatus)}>
                                {status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Commission Status - only visible to Admin and SuperAdmin */}
              <RoleBasedComponent requiredRole={UserRole.Admin}>
                <FormField
                  control={form.control}
                  name="commissionStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Status</FormLabel>
                      <Select 
                        disabled={loading} 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CommissionStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center">
                                <Badge className={getStatusBadgeStyle(status as CommissionStatus)}>
                                  {status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </RoleBasedComponent>
              
              <FormField
                control={form.control}
                name="isCompleted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Mark as Completed
                      </FormLabel>
                      <FormDescription>
                        Indicates that this booking has been fulfilled
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="pt-4 flex flex-col space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || formSubmitting}
                  onClick={() => {
                    console.log("Submit button clicked");
                    console.log("Form valid?", form.formState.isValid);
                    console.log("Form errors:", form.formState.errors);
                  }}
                >
                  {loading || formSubmitting ? "Processing..." : bookingId ? "Update Booking" : "Create Booking"}
                </Button>
                <Button variant="outline" type="button" className="w-full" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
};

export default BookingForm;
