
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import BookingForm from "@/components/forms/BookingForm";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NewBookingPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Extract trip ID from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const tripId = queryParams.get('trip');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Fetch trip data if tripId is provided
  useEffect(() => {
    const fetchTripData = async () => {
      if (!tripId) return;
      
      try {
        setLoading(true);
        
        // Fetch trip clients
        const { data: tripClients, error: tripClientsError } = await supabase
          .from('trip_clients')
          .select('client_id')
          .eq('trip_id', tripId);
          
        if (tripClientsError) throw tripClientsError;
        
        // Prepare initial data with clients and trip ID
        setInitialData({
          clients: tripClients?.map(tc => tc.client_id) || [],
          tripId: tripId
        });
        
      } catch (error: any) {
        console.error('Error fetching trip data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTripData();
  }, [tripId]);
  
  if (authLoading || (tripId && loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Booking</h1>
      </div>
      
      <div className="mt-6">
        <BookingForm initialData={initialData} />
      </div>
    </div>
  );
};

export default NewBookingPage;
