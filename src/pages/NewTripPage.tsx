
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import TripForm from "@/components/forms/TripForm";

const NewTripPage = () => {
  const { isAuthenticated, loading: authLoading, user, checkUserAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [agentName, setAgentName] = useState<string>("");
  const { toast } = useToast();
  const isAdmin = checkUserAccess(UserRole.Admin);
  
  // Extract client ID from URL query parameters
  const queryParams = new URLSearchParams(location.search);
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
  
  // Set up initial data for the trip form
  useEffect(() => {
    const setupInitialData = async () => {
      try {
        setLoading(true);
        console.log("Setting up initial data for trip form");
        
        let initialDataObj: any = {
          agentId: user?.id
        };
        
        // If clientId is provided, include it in the initial data
        if (clientId) {
          initialDataObj.clients = [clientId];
        } else {
          initialDataObj.clients = [];
        }
        
        console.log("Initial data for trip form:", initialDataObj);
        setInitialData(initialDataObj);
        
      } catch (error: any) {
        console.error('Error setting up initial data:', error);
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
      setupInitialData();
    }
  }, [clientId, user, toast]);
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Trip</h1>
      </div>
      
      {/* Agent information card - view only */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Trip Agent:</span>
            <span className="text-sm">{agentName || "Loading agent info..."}</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        {initialData && <TripForm initialData={initialData} />}
      </div>
    </div>
  );
};

export default NewTripPage;
