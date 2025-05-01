
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
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setBookingData(data);
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
