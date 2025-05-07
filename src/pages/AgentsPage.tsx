
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  User,
  UserPlus,
  Edit,
  Check,
  X,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";

const AgentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [shouldResetPassword, setShouldResetPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Define form schema
  const formSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    is_active: z.boolean(),
    password: z.string().optional(),
    role: z.enum(["SuperAdmin", "Admin", "Agent"]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      is_active: true,
      password: "",
      role: "Agent" as "SuperAdmin" | "Admin" | "Agent",
    },
  });

  // Fetch agents from Supabase
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('last_name', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        setAgents(data || []);
      } catch (error: any) {
        console.error('Error fetching agents:', error);
        toast({
          title: "Failed to load agents",
          description: error.message || "There was an error loading the agent data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [toast]);

  // Filter agents based on search term
  const filteredAgents = agents.filter((agent) => {
    if (!agent) return false;
    const fullName = `${agent.first_name || ''} ${agent.last_name || ''}`.toLowerCase();
    const email = (agent.email || '').toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  // Function to get role label and badge style
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SuperAdmin":
        return {
          label: "Super Admin",
          style: "bg-purple-100 text-purple-800 border-purple-200"
        };
      case "Admin":
        return {
          label: "Admin",
          style: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case "Agent":
        return {
          label: "Agent",
          style: "bg-green-100 text-green-800 border-green-200"
        };
      default:
        return {
          label: "Unknown",
          style: "bg-gray-100 text-gray-800 border-gray-200"
        };
    }
  };

  // Helper to convert string role to UserRole enum
  const getEnumRole = (roleString: string): UserRole => {
    switch (roleString) {
      case "SuperAdmin": return UserRole.SuperAdmin;
      case "Admin": return UserRole.Admin;
      case "Agent": 
      default: return UserRole.Agent;
    }
  };

  // Handle opening edit dialog
  const handleEditAgent = (agent: any) => {
    setSelectedAgent(agent);
    form.reset({
      first_name: agent.first_name || "",
      last_name: agent.last_name || "",
      email: agent.email || "",
      is_active: agent.is_active || false,
      password: "",
      role: agent.role || "Agent",
    });
    setShouldResetPassword(false);
    setEditDialogOpen(true);
  };

  // Handle agent update
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedAgent) return;
    
    try {
      setUpdateLoading(true);
      
      // Update profile in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          is_active: values.is_active,
          role: values.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedAgent.id);
      
      if (profileError) throw profileError;

      // Update email if it has changed
      if (values.email !== selectedAgent.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          selectedAgent.id,
          { email: values.email }
        );
        
        if (emailError) throw emailError;
      }
      
      // Update password if provided
      if (shouldResetPassword && values.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          selectedAgent.id,
          { password: values.password }
        );
        
        if (passwordError) throw passwordError;
      }
      
      // Refetch agents to update the view
      const { data: updatedAgents, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('last_name', { ascending: true });
      
      if (fetchError) throw fetchError;
      
      setAgents(updatedAgents || []);
      setEditDialogOpen(false);
      
      toast({
        title: "Agent updated",
        description: "Agent information has been updated successfully."
      });
    } catch (error: any) {
      console.error('Error updating agent:', error);
      toast({
        title: "Failed to update agent",
        description: error.message || "There was an error updating the agent",
        variant: "destructive"
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Function to check if current user can manage the target agent
  const canManageAgent = (agentRole: string): boolean => {
    if (!user) return false;
    
    // Convert string role to UserRole enum
    const targetAgentRole = getEnumRole(agentRole || "Agent");
    
    // Only allow editing if current user role is higher (lower number) than the agent's role
    return user.role < targetAgentRole;
  };

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <Button onClick={() => navigate('/admin/agents/new')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Travel Agents</CardTitle>
            <CardDescription>Manage your travel agent accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading agents...
                      </TableCell>
                    </TableRow>
                  ) : filteredAgents.length > 0 ? (
                    filteredAgents.map((agent) => {
                      if (!agent) return null;
                      const roleBadge = getRoleBadge(agent.role || "Agent");
                      const canManage = canManageAgent(agent.role);
                      
                      return (
                        <TableRow key={agent.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-muted p-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span>
                                {agent.first_name} {agent.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{agent.email}</TableCell>
                          <TableCell>
                            <Badge className={roleBadge.style} variant="outline">
                              {agent.role === "SuperAdmin" && <Shield className="mr-1 h-3 w-3" />}
                              {roleBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={agent.is_active ? "default" : "secondary"} className="capitalize">
                              {agent.is_active ? (
                                <Check className="mr-1 h-3 w-3" />
                              ) : (
                                <X className="mr-1 h-3 w-3" />
                              )}
                              {agent.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={!canManage}
                              onClick={() => handleEditAgent(agent)}
                              title={canManage ? "Edit agent" : "Cannot edit users with equal or higher role"}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No agents found. Try a different search term or add a new agent.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Agent Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update agent information and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="reset-password" 
                  checked={shouldResetPassword}
                  onCheckedChange={(checked) => setShouldResetPassword(!!checked)}
                />
                <Label htmlFor="reset-password">Change password</Label>
              </div>
              {shouldResetPassword && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Active Status
                      </FormLabel>
                      <FormDescription>
                        Inactive users cannot log in to the system
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        User Role
                      </FormLabel>
                      <FormDescription>
                        Sets the permission level for this user
                      </FormDescription>
                    </div>
                    <FormControl>
                      <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="Agent">Agent</option>
                        <option value="Admin">Admin</option>
                        <option value="SuperAdmin">Super Admin</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateLoading}>
                  {updateLoading ? "Updating..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </RoleBasedComponent>
  );
};

export default AgentsPage;
