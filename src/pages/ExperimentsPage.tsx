
import { useNavigate } from "react-router-dom";
import { 
  FlaskConical,
  ArrowLeft,
  Settings,
  TestTube,
  BarChart3,
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

const ExperimentsPage = () => {
  const navigate = useNavigate();

  return (
    <RoleBasedComponent 
      requiredRole={UserRole.SuperAdmin} 
      fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Panel
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Experiments</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <TestTube className="mr-2 h-5 w-5 text-primary" />
                Feature Flags
              </CardTitle>
              <CardDescription>Enable or disable experimental features</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Control the rollout of new features and A/B testing capabilities.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between" disabled>
                <span>Coming Soon</span>
                <Settings className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/graphs")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Graphs
              </CardTitle>
              <CardDescription>Advanced data visualization and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create and customize advanced charts and graphs for business insights.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between">
                <span>Explore Analytics</span>
                <BarChart3 className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            About Experiments
          </h3>
          <p className="text-sm text-muted-foreground">
            This area is reserved for experimental features and advanced administrative tools. 
            Only Super Administrators have access to these potentially system-altering capabilities. 
            Use with caution as these features may affect system stability.
          </p>
        </div>
      </div>
    </RoleBasedComponent>
  );
};

export default ExperimentsPage;
