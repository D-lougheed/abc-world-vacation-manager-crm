
import { useState } from "react";
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
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";

const AgentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Dummy data
  const agents = [
    { 
      id: "1", 
      firstName: "Michael", 
      lastName: "Brown", 
      email: "michael@abctravel.com", 
      role: UserRole.SuperAdmin, 
      isActive: true,
      bookingsCount: 45,
      lastActive: "2023-05-15T10:30:00",
    },
    { 
      id: "2", 
      firstName: "Sarah", 
      lastName: "Johnson", 
      email: "sarah@abctravel.com", 
      role: UserRole.Admin, 
      isActive: true,
      bookingsCount: 38,
      lastActive: "2023-05-14T16:45:00",
    },
    { 
      id: "3", 
      firstName: "David", 
      lastName: "Wilson", 
      email: "david@abctravel.com", 
      role: UserRole.Agent, 
      isActive: true,
      bookingsCount: 26,
      lastActive: "2023-05-15T09:15:00",
    },
    { 
      id: "4", 
      firstName: "Jennifer", 
      lastName: "Lee", 
      email: "jennifer@abctravel.com", 
      role: UserRole.Agent, 
      isActive: true,
      bookingsCount: 31,
      lastActive: "2023-05-15T11:20:00",
    },
    { 
      id: "5", 
      firstName: "Robert", 
      lastName: "Taylor", 
      email: "robert@abctravel.com", 
      role: UserRole.Agent, 
      isActive: false,
      bookingsCount: 12,
      lastActive: "2023-04-28T14:30:00",
    },
  ];

  // Filter agents based on search term
  const filteredAgents = agents.filter((agent) => {
    const fullName = `${agent.firstName} ${agent.lastName}`.toLowerCase();
    const email = agent.email.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  // Function to get role label and badge style
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.SuperAdmin:
        return {
          label: "Super Admin",
          style: "bg-purple-100 text-purple-800 border-purple-200"
        };
      case UserRole.Admin:
        return {
          label: "Admin",
          style: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case UserRole.Agent:
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

  // Get current user's role (simulated)
  const currentUserRole = UserRole.SuperAdmin;

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
                    <TableHead>Bookings</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => {
                    const roleBadge = getRoleBadge(agent.role);
                    // Only allow editing if current user role is higher (lower number) than the agent's role
                    const canManage = currentUserRole < agent.role;
                    
                    return (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-muted p-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span>
                              {agent.firstName} {agent.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{agent.email}</TableCell>
                        <TableCell>
                          <Badge className={roleBadge.style} variant="outline">
                            {agent.role === UserRole.SuperAdmin && <Shield className="mr-1 h-3 w-3" />}
                            {roleBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.isActive ? "default" : "secondary"} className="capitalize">
                            {agent.isActive ? (
                              <Check className="mr-1 h-3 w-3" />
                            ) : (
                              <X className="mr-1 h-3 w-3" />
                            )}
                            {agent.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{agent.bookingsCount}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(agent.lastActive).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" disabled={!canManage}>
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <MailPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAgents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
