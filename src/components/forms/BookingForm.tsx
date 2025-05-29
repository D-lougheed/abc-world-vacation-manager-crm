import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BookingStatus, CommissionStatus, BillingStatus } from "@/types";
import MultiSelect from "./MultiSelect";

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
  depositAmount: z.number().optional(),
  finalPaymentDueDate: z.date().optional(),
  notes: z.string().optional(),
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

const BookingForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(10);

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
    },
  });

  const watchedVendor = watch("vendor");
  const watchedServiceType = watch("serviceType");
  const watchedCost = watch("cost");
  const watchedCommissionRate = watch("commissionRate");

  // Calculate commission amount when cost or rate changes
  const commissionAmount = watchedCost && watchedCommissionRate 
    ? (watchedCost * watchedCommissionRate) / 100 
    : 0;

  useEffect(() => {
    fetchFormData();
  }, []);

  // Update commission rate when vendor or service type changes
  useEffect(() => {
    if (watchedVendor && watchedServiceType) {
      fetchCommissionRate(watchedVendor, watchedServiceType);
    }
  }, [watchedVendor, watchedServiceType]);

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
        setValue("commissionRate", rate);
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

  const fetchCommissionRate = async (vendorId: string, serviceTypeId: string) => {
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

      const bookingData = {
        vendor_id: data.vendor,
        trip_id: data.trip || null,
        service_type_id: data.serviceType,
        start_date: format(data.startDate, "yyyy-MM-dd"),
        start_time: data.startTime || null,
        end_date: data.endDate ? format(data.endDate, "yyyy-MM-dd") : null,
        end_time: data.endTime || null,
        location: data.location,
        cost: data.cost,
        commission_rate: data.commissionRate,
        commission_amount: calculatedCommissionAmount,
        booking_status: data.bookingStatus,
        commission_status: data.commissionStatus,
        billing_status: data.billingStatus || BillingStatus.Draft,
        deposit_amount: data.depositAmount || null,
        final_payment_due_date: data.finalPaymentDueDate ? format(data.finalPaymentDueDate, "yyyy-MM-dd") : null,
        notes: data.notes || null,
        agent_id: agents[0]?.id || null, // For now, assign to first agent
      };

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;

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
        title: "Booking created successfully",
        description: "The booking has been saved and is ready for processing.",
      });

      navigate("/bookings");
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error creating booking",
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create New Booking</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                onValueChange={(values) => setValue("clients", values)}
                placeholder="Select clients..."
              />
              {errors.clients && (
                <p className="text-sm text-destructive">{errors.clients.message}</p>
              )}
            </div>

            {/* Vendor Selection */}
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <Select onValueChange={(value) => setValue("vendor", value)}>
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

            {/* Trip Selection (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="trip">Associated Trip</Label>
              <Select onValueChange={(value) => setValue("trip", value)}>
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

            {/* Service Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select onValueChange={(value) => setValue("serviceType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((serviceType) => (
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
                      "w-[280px] justify-start text-left font-normal",
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
                    disabled={(date) =>
                      date > new Date()
                    }
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
              <Label htmlFor="startTime">Start Time (Optional)</Label>
              <Input
                type="time"
                id="startTime"
                {...register("startTime")}
              />
            </div>

            {/* End Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
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
                      date < watch("startDate")!
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Time (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (Optional)</Label>
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
            <CardTitle>Location</CardTitle>
            <CardDescription>Where will this service be provided?</CardDescription>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost & Commission</CardTitle>
            <CardDescription>Set the financial details for this booking</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {/* Cost */}
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

            {/* Commission Rate */}
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
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
            <div className="space-y-2 col-span-2">
              <Label htmlFor="commissionAmount">Commission Amount</Label>
              <Input
                type="text"
                id="commissionAmount"
                value={commissionAmount.toFixed(2)}
                readOnly
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Update the status of this booking</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Booking Status */}
            <div className="space-y-2">
              <Label htmlFor="bookingStatus">Booking Status *</Label>
              <Select onValueChange={(value) => setValue("bookingStatus", value as BookingStatus)}>
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
              <Label htmlFor="commissionStatus">Commission Status *</Label>
              <Select onValueChange={(value) => setValue("commissionStatus", value as CommissionStatus)}>
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

            {/* Billing Status (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="billingStatus">Billing Status (Optional)</Label>
              <Select onValueChange={(value) => setValue("billingStatus", value as BillingStatus)}>
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

            {/* Deposit Amount (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit Amount (Optional)</Label>
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

            {/* Final Payment Due Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="finalPaymentDueDate">Final Payment Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
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
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any extra details to note about this booking?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate("/bookings")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Booking"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
