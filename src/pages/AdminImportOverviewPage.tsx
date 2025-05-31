
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Tags as TagsIcon, Puzzle, ArrowRight, MapPin } from "lucide-react";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";

const importOptions = [
  {
    title: "Import Clients",
    description: "Bulk import client data from a CSV file.",
    icon: Users,
    path: "/admin/import/clients",
    requiredFields: ["firstName", "lastName"],
  },
  {
    title: "Import Vendors",
    description: "Bulk import vendor data from a CSV file.",
    icon: Briefcase,
    path: "/admin/import/vendors",
    requiredFields: ["name", "contactPerson", "email", "phone", "address", "serviceArea", "priceRange (1-5)", "commissionRate"],
  },
  {
    title: "Import Service Types",
    description: "Bulk import service types from a CSV file.",
    icon: Puzzle,
    path: "/admin/import/service-types",
    requiredFields: ["name"],
  },
  {
    title: "Import Tags",
    description: "Bulk import tags from a CSV file.",
    icon: TagsIcon,
    path: "/admin/import/tags",
    requiredFields: ["name"],
  },
  {
    title: "Import Location Tags",
    description: "Bulk import location tags from a CSV file.",
    icon: MapPin,
    path: "/admin/import/location-tags",
    requiredFields: ["continent", "country", "state_province", "city"],
  },
];

const AdminImportOverviewPage = () => {
  const navigate = useNavigate();

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mass Import Data</h1>
        </div>
        <p className="text-muted-foreground">
          Select an entity type below to begin importing data from a CSV file. Ensure your CSV file matches the required format and headers for successful import.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {importOptions.map((option) => (
            <Card key={option.title} className="cursor-pointer hover:bg-muted/50 flex flex-col" onClick={() => navigate(option.path)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <option.icon className="mr-2 h-5 w-5 text-primary" />
                  {option.title}
                </CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-2">
                  Required CSV Headers: <br/> <code className="text-xs bg-muted p-1 rounded">{option.requiredFields.join(", ")}</code>
                </p>
              </CardContent>
              <div className="p-6 pt-0">
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>Go to {option.title.toLowerCase()}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </RoleBasedComponent>
  );
};

export default AdminImportOverviewPage;
