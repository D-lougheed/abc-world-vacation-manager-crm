import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import BookingForm from "@/components/forms/BookingForm";
import { Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, BookingStatus, CommissionStatus, BillingStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const NewBookingPage = () => {
  const { isAuthenticated, loading: authLoading, user, checkUserAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [agentName, setAgentName] = useState<string>("");
  const { toast } = useToast();
  const isAdmin = checkUserAccess(UserRole.Admin);
  
  // Extract trip ID and client ID from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const tripId = queryParams.get('trip');
  const clientId = queryParams.get('clientId');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Fetch current agent name
  useEffect(() => {
    if (user) {
      const fetchAgentName = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Error fetching agent name:", error);
            return;
          }
          
          if (data) {
            setAgentName(`${data.first_name} ${data.last_name}`);
          }
        } catch (err) {
          console.error("Error in fetchAgentName:", err);
        }
      };
      
      fetchAgentName();
    }
  }, [user]);
  
  // Fetch trip data if tripId is provided, or client data if clientId is provided
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        console.log("Fetching initial data for booking form");
        console.log("Trip ID from URL:", tripId);
        
        let initialDataObj: any = {};
        
        // Fetch trip data if tripId is provided
        if (tripId) {
          // Get trip details including agent_id
          const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('agent_id')
            .eq('id', tripId)
            .single();
            
          if (tripError) throw tripError;
          
          const { data: tripClients, error: tripClientsError } = await supabase
            .from('trip_clients')
            .select('client_id')
            .eq('trip_id', tripId);
            
          if (tripClientsError) throw tripClientsError;
          
          initialDataObj = {
            clients: tripClients?.map(tc => tc.client_id) || [],
            trip: tripId, // Use 'trip' instead of 'tripId' to match the form field
            agentId: tripData?.agent_id || user?.id
          };
          
          console.log("Setting trip in initial data:", tripId);
        } 
        // If clientId is provided, use it to populate clients
        else if (clientId) {
          initialDataObj = {
            clients: [clientId],
            trip: null, // Use 'trip' instead of 'tripId'
            agentId: user?.id  // Always assign current user as agent
          };
        } else {
          // No parameters provided, use current user as agent
          initialDataObj = {
            clients: [], // Initialize with empty array to avoid undefined
            trip: null, // Use 'trip' instead of 'tripId'
            agentId: user?.id
          };
        }
        
        // Initialize booking and commission status with defaults
        initialDataObj.bookingStatus = BookingStatus.Pending;
        initialDataObj.commissionStatus = CommissionStatus.Unreceived;
        // Initialize new billing fields
        initialDataObj.billingStatus = BillingStatus.Draft;
        initialDataObj.depositAmount = null;
        initialDataObj.finalPaymentDueDate = null;
        
        console.log("Final initial data for booking form:", initialDataObj);
        setInitialData(initialDataObj);
        
      } catch (error: any) {
        console.error('Error fetching initial data:', error);
        toast({
          title: "Error",
          description: `Failed to load initial data: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchInitialData();
    }
  }, [tripId, clientId, user, toast]);
  
  // Fetch trips that belong only to the current agent
  useEffect(() => {
    if (user && !isAdmin) {
      const fetchAgentTrips = async () => {
        try {
          const { data, error } = await supabase
            .from('trips')
            .select('id, name')
            .eq('agent_id', user.id)
            .order('start_date', { ascending: false });
            
          if (error) {
            console.error("Error fetching agent trips:", error);
          }
          
          console.log("Agent trips:", data);
        } catch (err) {
          console.error("Error in fetchAgentTrips:", err);
        }
      };
      
      fetchAgentTrips();
    }
  }, [user, isAdmin]);
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only render the form once initialData has been set
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Booking</h1>
      </div>
      
      {/* Agent information card - view only */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Booking Agent:</span>
            <span className="text-sm">{agentName || "Loading agent info..."}</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        {initialData && <BookingForm initialData={initialData} />}
      </div>
    </div>
  );
};

export default NewBookingPage;
