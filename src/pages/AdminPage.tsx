
import { useNavigate } from "react-router-dom";
import { 
  Settings,
  Users,
  Tags,
  Briefcase,
  ArrowRight,
  UploadCloud,
  FileText,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";

const AdminPage = () => {
  const navigate = useNavigate();

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/agents")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Agent Management
              </CardTitle>
              <CardDescription>Manage travel agent accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add, edit, and manage agent accounts. Control access levels and reset passwords.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between">
                <span>Manage Agents</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/service-types")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-primary" />
                Service Types
              </CardTitle>
              <CardDescription>Configure service types for vendors and bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create and manage service categories that can be assigned to vendors and used in bookings.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between">
                <span>Manage Service Types</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/tags")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Tags className="mr-2 h-5 w-5 text-primary" />
                Tag Management
              </CardTitle>
              <CardDescription>Organize and standardize the tagging system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create, edit, and organize tags used throughout the system. Consolidate duplicates and remove unused tags.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between">
                <span>Manage Tags</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/location-tags")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Location Tags
              </CardTitle>
              <CardDescription>Manage location-based tags and categorization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create and organize location tags by continent, country, state/province, and city for better categorization.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between">
                <span>Manage Location Tags</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/import")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <UploadCloud className="mr-2 h-5 w-5 text-primary" />
                Mass Import
              </CardTitle>
              <CardDescription>Import data from CSV files</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Bulk import Clients, Vendors, Service Types, and Tags using CSV files.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between">
                <span>Go to Mass Import</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/audit-logs")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Audit Logs
              </CardTitle>
              <CardDescription>View system event logs and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track important activities like record creation, imports, and administrative changes.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between">
                <span>View Audit Logs</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/system-settings")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                System Settings
              </CardTitle>
              <CardDescription>Configure global system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure global settings, default values, and system behaviors. E.g., default commission rate.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between">
                <span>Configure Settings</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleBasedComponent>
  );
};

export default AdminPage;
