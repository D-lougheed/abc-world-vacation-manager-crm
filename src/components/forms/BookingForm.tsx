import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BookingStatus, CommissionStatus, BillingStatus } from "@/types";
import { MultiSelect } from "./MultiSelect";

const bookingSchema = z.object({
  clients: z.array(z.string()).min(1, "At least one client is required"),
  vendor: z.string().min(1, "Vendor is required"),
  trip: z.string().optional(),
  serviceType: z.string().min(1, "Service type is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  startTime: z.string().optional(),
  endDate: z.date().optional(),
  endTime: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  cost: z.number().min(0, "Cost must be a positive number"),
  commissionRate: z.number().min(0).max(100, "Commission rate must be between 0 and 100"),
  bookingStatus: z.enum(["Pending", "Confirmed", "Canceled"]),
  commissionStatus: z.enum(["Unreceived", "Received", "Completed", "Canceled"]),
  billingStatus: z.enum(["Draft", "Awaiting Deposit", "Awaiting Final Payment", "Paid"]).optional(),
  depositAmount: z.number().optional(), // Made optional
  finalPaymentDueDate: z.date().optional(),
  isCompleted: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(), // Made optional
  clientRating: z.number().min(1).max(5).optional(), // Made optional
  notes: z.string().optional(),
  agentId: z.string().min(1, "Agent is required"),
  subAgent: z.string().optional(), // Made optional
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface Trip {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface ServiceType {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
}

interface BookingFormProps {
  initialData?: any;
  bookingId?: string;
}

const BookingForm = ({ initialData, bookingId }: BookingFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [filteredServiceTypes, setFilteredServiceTypes] = useState<ServiceType[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(10);

  const isEditing = !!bookingId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingStatus: BookingStatus.Pending,
      commissionStatus: CommissionStatus.Unreceived,
      billingStatus: BillingStatus.Draft,
      commissionRate: defaultCommissionRate,
      isCompleted: false,
      agentId: initialData?.agentId || "",
      ...initialData,
    },
  });

  const watchedVendor = watch("vendor");
  const watchedServiceType = watch("serviceType");
  const watchedCost = watch("cost");
  const watchedCommissionRate = watch("commissionRate");
  const watchedRating = watch("rating");
  const watchedClientRating = watch("clientRating");

  // Calculate commission amount when cost or rate changes
  const commissionAmount = watchedCost && watchedCommissionRate 
    ? (watchedCost * watchedCommissionRate) / 100 
    : 0;

  useEffect(() => {
    fetchFormData();
    if (initialData) {
      populateFormWithInitialData();
    }
  }, []);

  const populateFormWithInitialData = () => {
    if (!initialData) return;

    // Set form values from initial data
    Object.keys(initialData).forEach((key) => {
      if (initialData[key] !== undefined) {
        setValue(key as keyof BookingFormData, initialData[key]);
      }
    });
  };

  // Filter service types when vendor changes
  useEffect(() => {
    if (watchedVendor) {
      fetchVendorServiceTypes(watchedVendor);
      fetchCommissionRate(watchedVendor, watchedServiceType);
    } else {
      setFilteredServiceTypes([]);
      // Clear service type if vendor is cleared
      setValue("serviceType", "");
    }
  }, [watchedVendor]);

  // Update commission rate when service type changes (if vendor is already selected)
  useEffect(() => {
    if (watchedVendor && watchedServiceType) {
      fetchCommissionRate(watchedVendor, watchedServiceType);
    }
  }, [watchedServiceType]);

  const fetchFormData = async () => {
    try {
      setLoading(true);

      // Fetch default commission rate
      const { data: commissionSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "default_vendor_commission_percentage")
        .maybeSingle();

      if (commissionSetting?.value) {
        const rate = parseFloat(commissionSetting.value);
        setDefaultCommissionRate(rate);
        if (!initialData?.commissionRate) {
          setValue("commissionRate", rate);
        }
      }

      const [clientsResult, vendorsResult, tripsResult, serviceTypesResult, agentsResult] = await Promise.all([
        supabase.from("clients").select("id, first_name, last_name").order("first_name"),
        supabase.from("vendors").select("id, name").order("name"),
        supabase.from("trips").select("id, name, start_date, end_date").order("start_date", { ascending: false }),
        supabase.from("service_types").select("id, name").order("name"),
        supabase.from("profiles").select("id, first_name, last_name").eq("role", "Agent").order("first_name"),
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (vendorsResult.error) throw vendorsResult.error;
      if (tripsResult.error) throw tripsResult.error;
      if (serviceTypesResult.error) throw serviceTypesResult.error;
      if (agentsResult.error) throw agentsResult.error;

      setClients(clientsResult.data || []);
      setVendors(vendorsResult.data || []);
      setTrips(tripsResult.data || []);
      setServiceTypes(serviceTypesResult.data || []);
      setAgents(agentsResult.data || []);

      // If editing and vendor is already selected, fetch service types for that vendor
      if (initialData?.vendor) {
        fetchVendorServiceTypes(initialData.vendor);
      }
    } catch (error: any) {
      console.error("Error fetching form data:", error);
      toast({
        title: "Error loading form data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorServiceTypes = async (vendorId: string) => {
    try {
      // Get service types for the selected vendor
      const { data: vendorServiceTypes, error } = await supabase
        .from("vendor_service_types")
        .select(`
          service_type_id,
          service_types (id, name)
        `)
        .eq("vendor_id", vendorId);

      if (error) {
        console.error("Error fetching vendor service types:", error);
        setFilteredServiceTypes([]);
        return;
      }

      // Extract service types from the junction table result
      const availableServiceTypes = vendorServiceTypes
        ?.map(vst => vst.service_types)
        .filter(Boolean) || [];

      setFilteredServiceTypes(availableServiceTypes as ServiceType[]);

      // If current service type is not available for this vendor, clear it
      const currentServiceType = watchedServiceType;
      if (currentServiceType && !availableServiceTypes.some(st => st?.id === currentServiceType)) {
        setValue("serviceType", "");
      }

    } catch (error: any) {
      console.error("Error fetching vendor service types:", error);
      setFilteredServiceTypes([]);
    }
  };

  const fetchCommissionRate = async (vendorId: string, serviceTypeId: string) => {
    if (!serviceTypeId) return;

    try {
      // First try to get service-type-specific commission rate
      const { data: commissionData, error: commissionError } = await supabase
        .from("vendor_service_type_commissions")
        .select("commission_rate")
        .eq("vendor_id", vendorId)
        .eq("service_type_id", serviceTypeId)
        .maybeSingle();

      if (commissionError) {
        console.error("Error fetching commission rate:", commissionError);
        setValue("commissionRate", defaultCommissionRate);
        return;
      }

      if (commissionData) {
        setValue("commissionRate", commissionData.commission_rate);
      } else {
        // If no specific rate found, use default
        setValue("commissionRate", defaultCommissionRate);
      }
    } catch (error: any) {
      console.error("Error fetching commission rate:", error);
      setValue("commissionRate", defaultCommissionRate);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setLoading(true);

      // Calculate commission amount
      const calculatedCommissionAmount = (data.cost * data.commissionRate) / 100;

      // Convert time format from 12hr to 24hr for database storage
      const convertTo24HourFormat = (time12: string): string | null => {
        if (!time12) return null;
        
        const [time, period] = time12.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
      };

      const bookingData = {
        vendor_id: data.vendor,
        trip_id: data.trip || null,
        service_type_id: data.serviceType,
        start_date: format(data.startDate, "yyyy-MM-dd"),
        start_time: convertTo24HourFormat(data.startTime || ""),
        end_date: data.endDate ? format(data.endDate, "yyyy-MM-dd") : null,
        end_time: convertTo24HourFormat(data.endTime || ""),
        location: data.location,
        cost: data.cost,
        commission_rate: data.commissionRate,
        commission_amount: calculatedCommissionAmount,
        booking_status: data.bookingStatus,
        commission_status: data.commissionStatus,
        billing_status: data.billingStatus || BillingStatus.Draft,
        deposit_amount: data.depositAmount || null,
        final_payment_due_date: data.finalPaymentDueDate ? format(data.finalPaymentDueDate, "yyyy-MM-dd") : null,
        is_completed: data.isCompleted || false,
        rating: data.rating || null,
        client_rating: data.clientRating || null,
        notes: data.notes || null,
        agent_id: data.agentId,
        sub_agent_id: data.subAgent || null,
      };

      let booking;
      if (isEditing) {
        // Update existing booking
        const { data: updatedBooking, error: bookingError } = await supabase
          .from("bookings")
          .update(bookingData)
          .eq("id", bookingId)
          .select()
          .single();

        if (bookingError) throw bookingError;
        booking = updatedBooking;

        // Update client relationships - first delete existing, then insert new
        const { error: deleteError } = await supabase
          .from("booking_clients")
          .delete()
          .eq("booking_id", bookingId);

        if (deleteError) throw deleteError;
      } else {
        // Create new booking
        const { data: newBooking, error: bookingError } = await supabase
          .from("bookings")
          .insert(bookingData)
          .select()
          .single();

        if (bookingError) throw bookingError;
        booking = newBooking;
      }

      // Insert client relationships
      if (data.clients.length > 0) {
        const clientRelations = data.clients.map(clientId => ({
          booking_id: booking.id,
          client_id: clientId,
        }));

        const { error: clientError } = await supabase
          .from("booking_clients")
          .insert(clientRelations);

        if (clientError) throw clientError;
      }

      toast({
        title: isEditing ? "Booking updated successfully" : "Booking created successfully",
        description: isEditing 
          ? "The booking has been updated and is ready for processing."
          : "The booking has been saved and is ready for processing.",
      });

      navigate("/bookings");
    } catch (error: any) {
      console.error("Error saving booking:", error);
      toast({
        title: isEditing ? "Error updating booking" : "Error creating booking",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Find the agent name for display
  const currentAgent = agents.find(agent => agent.id === initialData?.agentId);
  const agentName = currentAgent ? `${currentAgent.first_name} ${currentAgent.last_name}` : "Not assigned";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{isEditing ? "Edit Booking" : "Create New Booking"}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - User Input Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Enter the basic information for this booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Selection */}
                <div className="space-y-2">
                  <Label htmlFor="clients">Clients *</Label>
                  <MultiSelect
                    options={clients.map(client => ({
                      value: client.id,
                      label: `${client.first_name} ${client.last_name}`,
                    }))}
                    selected={watch("clients") || []}
                    onChange={(values) => setValue("clients", values)}
                    placeholder="Select clients..."
                  />
                  {errors.clients && (
                    <p className="text-sm text-destructive">{errors.clients.message}</p>
                  )}
                </div>

                {/* Vendor Selection */}
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select value={watch("vendor")} onValueChange={(value) => setValue("vendor", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vendor && (
                    <p className="text-sm text-destructive">{errors.vendor.message}</p>
                  )}
                </div>

                {/* Service Type Selection - Filtered by Vendor */}
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select 
                    value={watch("serviceType")} 
                    onValueChange={(value) => setValue("serviceType", value)}
                    disabled={!watchedVendor}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={watchedVendor ? "Select a service type" : "Select a vendor first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredServiceTypes.map((serviceType) => (
                        <SelectItem key={serviceType.id} value={serviceType.id}>
                          {serviceType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceType && (
                    <p className="text-sm text-destructive">{errors.serviceType.message}</p>
                  )}
                </div>

                {/* Trip Selection (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="trip">Associated Trip</Label>
                  <Select value={watch("trip")} onValueChange={(value) => setValue("trip", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a trip (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.name} ({format(new Date(trip.start_date), "MMM dd")} - {format(new Date(trip.end_date), "MMM dd, yyyy")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Booking Agent Section */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Agent</CardTitle>
                <CardDescription>Agent information for this booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Agent (Now editable) */}
                <div className="space-y-2">
                  <Label htmlFor="agentId">Primary Agent *</Label>
                  <Select value={watch("agentId")} onValueChange={(value) => setValue("agentId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.first_name} {agent.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.agentId && (
                    <p className="text-sm text-destructive">{errors.agentId.message}</p>
                  )}
                </div>

                {/* Sub-Agent Selection */}
                <div className="space-y-2">
                  <Label htmlFor="subAgent">Sub-Agent</Label>
                  <Select value={watch("subAgent")} onValueChange={(value) => setValue("subAgent", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sub-agent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.first_name} {agent.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subAgent && (
                    <p className="text-sm text-destructive">{errors.subAgent.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
                <CardDescription>Set the date and time for this booking</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !watch("startDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("startDate") ? (
                          format(watch("startDate"), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watch("startDate")}
                        onSelect={(date) => setValue("startDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate.message}</p>
                  )}
                </div>

                {/* Start Time (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    type="time"
                    id="startTime"
                    {...register("startTime")}
                  />
                </div>

                {/* End Date (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !watch("endDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("endDate") ? (
                          format(watch("endDate"), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watch("endDate")}
                        onSelect={(date) => setValue("endDate", date)}
                        disabled={(date) =>
                          watch("startDate") && date < watch("startDate")!
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Time (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    type="time"
                    id="endTime"
                    {...register("endTime")}
                  />
                </div>
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
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    type="text"
                    id="location"
                    placeholder="Enter the location"
                    {...register("location")}
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location.message}</p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes for this booking..."
                    {...register("notes")}
                  />
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
                {/* Cost - Moved here from Location & Details */}
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost *</Label>
                  <Input
                    type="number"
                    id="cost"
                    placeholder="0.00"
                    {...register("cost", { valueAsNumber: true })}
                  />
                  {errors.cost && (
                    <p className="text-sm text-destructive">{errors.cost.message}</p>
                  )}
                </div>

                {/* Billing Status */}
                <div className="space-y-2">
                  <Label htmlFor="billingStatus">Billing Status</Label>
                  <Select value={watch("billingStatus")} onValueChange={(value) => setValue("billingStatus", value as BillingStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BillingStatus.Draft}>Draft</SelectItem>
                      <SelectItem value={BillingStatus.AwaitingDeposit}>Awaiting Deposit</SelectItem>
                      <SelectItem value={BillingStatus.AwaitingFinalPayment}>Awaiting Final Payment</SelectItem>
                      <SelectItem value={BillingStatus.Paid}>Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.billingStatus && (
                    <p className="text-sm text-destructive">{errors.billingStatus.message}</p>
                  )}
                </div>

                {/* Deposit Amount */}
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount</Label>
                  <Input
                    type="number"
                    id="depositAmount"
                    placeholder="0.00"
                    {...register("depositAmount", { valueAsNumber: true })}
                  />
                  {errors.depositAmount && (
                    <p className="text-sm text-destructive">{errors.depositAmount.message}</p>
                  )}
                </div>

                {/* Final Payment Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="finalPaymentDueDate">Final Payment Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !watch("finalPaymentDueDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("finalPaymentDueDate") ? (
                          format(watch("finalPaymentDueDate"), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watch("finalPaymentDueDate")}
                        onSelect={(date) => setValue("finalPaymentDueDate", date)}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.finalPaymentDueDate && (
                    <p className="text-sm text-destructive">{errors.finalPaymentDueDate.message}</p>
                  )}
                </div>
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
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    type="number"
                    id="commissionRate"
                    placeholder="0"
                    {...register("commissionRate", { valueAsNumber: true })}
                  />
                  {errors.commissionRate && (
                    <p className="text-sm text-destructive">{errors.commissionRate.message}</p>
                  )}
                </div>

                {/* Commission Amount (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="commissionAmount">Commission Amount</Label>
                  <Input
                    type="text"
                    id="commissionAmount"
                    value={`$${commissionAmount.toFixed(2)}`}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
                <CardDescription>Update booking and commission status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Booking Status */}
                <div className="space-y-2">
                  <Label htmlFor="bookingStatus">Booking Status</Label>
                  <Select value={watch("bookingStatus")} onValueChange={(value) => setValue("bookingStatus", value as BookingStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BookingStatus.Pending}>Pending</SelectItem>
                      <SelectItem value={BookingStatus.Confirmed}>Confirmed</SelectItem>
                      <SelectItem value={BookingStatus.Canceled}>Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.bookingStatus && (
                    <p className="text-sm text-destructive">{errors.bookingStatus.message}</p>
                  )}
                </div>

                {/* Commission Status */}
                <div className="space-y-2">
                  <Label htmlFor="commissionStatus">Commission Status</Label>
                  <Select value={watch("commissionStatus")} onValueChange={(value) => setValue("commissionStatus", value as CommissionStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CommissionStatus.Unreceived}>Unreceived</SelectItem>
                      <SelectItem value={CommissionStatus.Received}>Received</SelectItem>
                      <SelectItem value={CommissionStatus.Completed}>Completed</SelectItem>
                      <SelectItem value={CommissionStatus.Canceled}>Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.commissionStatus && (
                    <p className="text-sm text-destructive">{errors.commissionStatus.message}</p>
                  )}
                </div>

                {/* Completion Status */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isCompleted"
                      checked={watch("isCompleted") || false}
                      onCheckedChange={(checked) => setValue("isCompleted", checked as boolean)}
                    />
                    <Label htmlFor="isCompleted">Mark as Completed</Label>
                  </div>
                  {errors.isCompleted && (
                    <p className="text-sm text-destructive">{errors.isCompleted.message}</p>
                  )}
                </div>

                {/* Vendor Rating - Now optional */}
                <div className="space-y-2">
                  <Label htmlFor="rating">Vendor Rating (Optional)</Label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setValue("rating", star)}
                        className={cn(
                          "p-1 rounded-full hover:bg-muted transition-colors",
                          watchedRating && star <= watchedRating 
                            ? "text-yellow-500" 
                            : "text-gray-300"
                        )}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                  {errors.rating && (
                    <p className="text-sm text-destructive">{errors.rating.message}</p>
                  )}
                </div>

                {/* Client Rating - Now optional */}
                <div className="space-y-2">
                  <Label htmlFor="clientRating">Client Rating (Optional)</Label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setValue("clientRating", star)}
                        className={cn(
                          "p-1 rounded-full hover:bg-muted transition-colors",
                          watchedClientRating && star <= watchedClientRating 
                            ? "text-blue-500" 
                            : "text-gray-300"
                        )}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                  {errors.clientRating && (
                    <p className="text-sm text-destructive">{errors.clientRating.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate("/bookings")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Booking" : "Create Booking")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
