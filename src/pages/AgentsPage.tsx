
import { useState, useEffect } from "react";
import { 
  Search, 
  User,
  UserPlus,
  UserCog,
  MailPlus,
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

const AgentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Handle sending password reset email
  const handleSendResetEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset email sent",
        description: "The user will receive instructions to reset their password."
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Failed to send reset email",
        description: error.message || "There was an error sending the reset email",
        variant: "destructive"
      });
    }
  };

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <Button>
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
                      const agentRole = getEnumRole(agent.role || "Agent");
                      
                      // Only allow editing if current user role is higher (lower number) than the agent's role
                      const canManage = user && user.role < agentRole;
                      
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
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon" disabled={!canManage}>
                                <UserCog className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleSendResetEmail(agent.email)}
                              >
                                <MailPlus className="h-4 w-4" />
                              </Button>
                            </div>
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
    </RoleBasedComponent>
  );
};

export default AgentsPage;
