
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, X } from "lucide-react";
import { MultiSelect } from "./MultiSelect";
import { useAuth } from "@/contexts/AuthContext";
import { addAuditLog } from "@/services/AuditLogService";

interface TripFormProps {
  initialData?: {
    agentId?: string;
    clients?: string[];
  };
}

const TripForm = ({ initialData }: TripFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>(initialData?.clients || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      notes: "",
      startDate: "",
      endDate: "",
      status: "Planned"
    }
  });

  // Fetch all clients for the multi-select
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name')
          .order('first_name');

        if (error) throw error;

        const formattedClients = data.map(client => ({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`
        }));

        setClients(formattedClients);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive"
        });
      }
    };

    fetchClients();
  }, [toast]);

  const onSubmit = async (data: any) => {
    try {
      setSaving(true);

      if (selectedClients.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one client for this trip",
          variant: "destructive"
        });
        return;
      }

      // Create the trip
      const tripData = {
        name: data.name,
        description: data.description,
        notes: data.notes,
        start_date: data.startDate,
        end_date: data.endDate,
        status: data.status,
        agent_id: initialData?.agentId || user?.id
      };

      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (tripError) throw tripError;

      // Associate clients with the trip
      const tripClientData = selectedClients.map(clientId => ({
        trip_id: newTrip.id,
        client_id: clientId
      }));

      const { error: clientError } = await supabase
        .from('trip_clients')
        .insert(tripClientData);

      if (clientError) throw clientError;

      toast({
        title: "Trip created",
        description: "New trip has been created successfully"
      });

      // Add audit log
      if (user) {
        await addAuditLog(user, {
          action: 'CREATE_TRIP',
          resourceType: 'Trip',
          resourceId: newTrip.id,
          details: { 
            tripData: { ...tripData, id: newTrip.id },
            clientIds: selectedClients
          },
        });
      }

      navigate(`/trips/${newTrip.id}`);
    } catch (error: any) {
      console.error('Error creating trip:', error);
      toast({
        title: "Failed to create trip",
        description: error.message || "There was an error creating the trip",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/trips');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Trip Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Trip name is required" })}
              placeholder="Enter trip name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter trip description"
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate", { required: "Start date is required" })}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate", { required: "End date is required" })}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="clients">Clients *</Label>
            <MultiSelect
              options={clients.map(client => ({ value: client.id, label: client.name }))}
              selected={selectedClients}
              onChange={setSelectedClients}
              placeholder="Select clients for this trip"
            />
            {selectedClients.length === 0 && (
              <p className="text-sm text-red-600 mt-1">Please select at least one client</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Add any additional notes"
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Create Trip
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={saving} className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TripForm;
