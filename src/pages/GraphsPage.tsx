
import { useNavigate } from "react-router-dom";
import { 
  BarChart3,
  ArrowLeft,
  TrendingUp,
  PieChart,
  LineChart,
  Activity,
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

const GraphsPage = () => {
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
            onClick={() => navigate("/admin/experiments")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Experiments
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Advanced Graphs & Analytics</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>Advanced revenue tracking and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Visualize revenue trends, commission analytics, and financial projections with interactive charts.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between" disabled>
                <span>Coming Soon</span>
                <Activity className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5 text-primary" />
                Customer Insights
              </CardTitle>
              <CardDescription>Deep dive into customer behavior patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Analyze client demographics, booking preferences, and travel patterns with pie charts and heat maps.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between" disabled>
                <span>Coming Soon</span>
                <Activity className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <LineChart className="mr-2 h-5 w-5 text-primary" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Track KPIs and business performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor key performance indicators, agent productivity, and system usage with real-time dashboards.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 w-full justify-between" disabled>
                <span>Coming Soon</span>
                <Activity className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            About Advanced Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            This experimental analytics section provides access to advanced data visualization tools and business intelligence features. 
            These tools are designed to give Super Administrators deep insights into business operations, trends, and performance metrics 
            that go beyond standard reporting capabilities.
          </p>
        </div>
      </div>
    </RoleBasedComponent>
  );
};

export default GraphsPage;
