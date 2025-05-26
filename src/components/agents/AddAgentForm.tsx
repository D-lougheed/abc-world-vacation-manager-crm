
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole } from "@/types"; // Renamed User to AuthUserType to avoid conflict
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { addAuditLog } from "@/services/AuditLogService"; // Import the audit log service
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define form schema with validation
const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum([UserRole.Agent, UserRole.Admin, UserRole.SuperAdmin], {
    required_error: "Please select a role",
  }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  agentCommissionPercentage: z.coerce // Use coerce to convert string from input to number
    .number({ invalid_type_error: "Commission must be a number" })
    .min(0, "Commission cannot be less than 0")
    .max(100, "Commission cannot be more than 100")
    .optional()
    .nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const AddAgentForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); // Get the current authenticated user

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: UserRole.Agent,
      password: "",
      agentCommissionPercentage: 50, // Default to 50%
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting form values:", values);

      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to create an agent");
      }
      
      console.log("Got session, access token available");

      // Call our edge function to create the agent - using the full URL
      // IMPORTANT: The create-agent edge function needs to be updated to handle agentCommissionPercentage.
      // Since I cannot modify edge functions directly, this field might not be saved for new agents
      // until the edge function is updated manually.
      const response = await fetch('https://gvslnylvljmhvlkixmmu.supabase.co/functions/v1/create-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          agentCommissionPercentage: values.agentCommissionPercentage !== null && values.agentCommissionPercentage !== undefined ? values.agentCommissionPercentage : 50, // Send commission, default if null/undefined
        })
      });
      
      console.log("Response status:", response.status);
      const responseData = await response.json(); 
      console.log("Response data:", responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create agent");
      }

      // Add audit log
      if (currentUser && responseData.user?.id) {
        await addAuditLog(currentUser, {
          action: 'CREATE_AGENT',
          resourceType: 'Agent',
          resourceId: responseData.user.id, // ID of the created agent user
          details: { 
            email: values.email, 
            role: values.role, 
            agentCommissionPercentage: values.agentCommissionPercentage 
          },
        });
      }

      toast({
        title: "Agent created successfully",
        description: `${values.firstName} ${values.lastName} has been added as a ${values.role}.`,
      });

      // Navigate back to the agents list
      navigate("/admin/agents");
    } catch (error: any) {
      console.error("Error creating agent:", error);
      toast({
        title: "Failed to create agent",
        description: error.message || "There was an error creating the agent. Note: The 'create-agent' edge function might need an update to save commission percentage.",
        variant: "destructive",
      });
      // Optionally log the failure as well
      if (currentUser) {
        await addAuditLog(currentUser, {
          action: 'CREATE_AGENT_FAILED',
          resourceType: 'Agent',
          details: { email: values.email, error: error.message },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="agent@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.Agent}>Agent</SelectItem>
                  <SelectItem value={UserRole.Admin}>Admin</SelectItem>
                  <SelectItem value={UserRole.SuperAdmin}>Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="agentCommissionPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent Commission Percentage (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="50" 
                  {...field} 
                  value={field.value ?? ""}
                  onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/agents")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Agent"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddAgentForm;

