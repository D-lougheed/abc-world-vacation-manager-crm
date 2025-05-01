
import { useParams } from "react-router-dom";
import BookingForm from "@/components/forms/BookingForm";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const EditBookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        if (!id) return;
        
        // Fetch the booking data
        setLoading(true);
        
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            vendor:vendor_id (*),
            service_type:service_type_id (*),
            booking_clients (client_id)
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        // Helper function to convert 24hr time to 12hr format
        const convertTo12HourFormat = (time24: string | null): string => {
          if (!time24) return "";
          
          const [hours, minutes] = time24.split(':').map(Number);
          const period = hours >= 12 ? 'PM' : 'AM';
          const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
          
          return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
        };
        
        // Transform the data to match the form's expected format
        const formattedData = {
          ...data,
          clients: data.booking_clients.map((bc: any) => bc.client_id),
          vendor: data.vendor_id, // Use vendor_id directly as a string
          serviceType: data.service_type_id,
          startDate: new Date(data.start_date),
          startTime: data.start_time ? convertTo12HourFormat(data.start_time) : "",
          endDate: data.end_date ? new Date(data.end_date) : undefined,
          endTime: data.end_time ? convertTo12HourFormat(data.end_time) : "",
          commissionRate: data.commission_rate,
          bookingStatus: data.booking_status,
          commissionStatus: data.commission_status,
          isCompleted: data.is_completed,
          tripId: data.trip_id || "no_trip"
        };
        
        setBookingData(formattedData);
      } catch (error: any) {
        console.error("Error fetching booking data:", error);
        toast({
          title: "Error",
          description: `Failed to load booking: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading booking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Booking</h1>
      
      {bookingData && (
        <BookingForm 
          initialData={bookingData} 
          bookingId={id} 
        />
      )}
    </div>
  );
};

export default EditBookingPage;
