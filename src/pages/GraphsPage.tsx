
import { useNavigate } from "react-router-dom";
import { 
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import SimpleBookingsChart from "@/components/charts/SimpleBookingsChart";

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
            <h1 className="text-3xl font-bold">Bookings Analytics</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBookingsChart />
          </CardContent>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default GraphsPage;
