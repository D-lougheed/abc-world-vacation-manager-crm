
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useBookingRating = (bookingId: string, vendorId: string) => {
  const [rating, setRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRating = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('rating')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setRating(data.rating);
    } catch (error) {
      console.error("Error fetching rating:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRating = async (newRating: number) => {
    try {
      setIsLoading(true);
      
      // Update booking rating
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ rating: newRating })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Call edge function to update vendor rating
      const { error: functionError } = await supabase.functions.invoke('update-vendor-ratings', {
        body: { vendor_id: vendorId }
      });

      if (functionError) throw functionError;

      setRating(newRating);
      toast({
        title: "Rating updated",
        description: "Your rating has been saved successfully",
      });
    } catch (error: any) {
      console.error("Error updating rating:", error);
      toast({
        title: "Failed to update rating",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rating,
    isLoading,
    fetchRating,
    updateRating
  };
};
