
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import AddAgentForm from "@/components/agents/AddAgentForm";

const AddAgentPage = () => {
  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Add New Agent</h1>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>New Agent Details</CardTitle>
            <CardDescription>
              Create a new agent account by filling out the form below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddAgentForm />
          </CardContent>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default AddAgentPage;
