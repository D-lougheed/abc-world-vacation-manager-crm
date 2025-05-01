
import { useState } from "react";
import { 
  Search, 
  Plus,
  Briefcase,
  Tags,
  Trash2,
  Edit,
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

const ServiceTypesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Dummy data
  const serviceTypes = [
    { 
      id: "1", 
      name: "Flight", 
      tags: ["Domestic", "International", "Economy", "Business", "First Class"],
      vendorCount: 12
    },
    { 
      id: "2", 
      name: "Accommodation", 
      tags: ["Hotel", "Resort", "Villa", "Luxury", "Budget", "Family-Friendly"],
      vendorCount: 18
    },
    { 
      id: "3", 
      name: "Cruise", 
      tags: ["Ocean", "River", "Luxury", "Adventure"],
      vendorCount: 6
    },
    { 
      id: "4", 
      name: "Tour", 
      tags: ["Guided", "Self-Guided", "Cultural", "Adventure", "Food"],
      vendorCount: 9
    },
    { 
      id: "5", 
      name: "Transportation", 
      tags: ["Car Rental", "Transfer", "Chauffeur", "Luxury"],
      vendorCount: 14
    },
    { 
      id: "6", 
      name: "Insurance", 
      tags: ["Travel Insurance", "Medical", "Cancellation"],
      vendorCount: 3
    },
  ];

  // Filter service types based on search term
  const filteredServiceTypes = serviceTypes.filter((serviceType) => {
    const name = serviceType.name.toLowerCase();
    const tags = serviceType.tags.join(" ").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || tags.includes(searchTerm.toLowerCase());
  });

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Service Types</h1>
          <Button>
            <Briefcase className="mr-2 h-4 w-4" />
            Add Service Type
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Service Types Management</CardTitle>
            <CardDescription>Configure service types used for vendors and bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search service types..."
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
                    <TableHead>Service Type</TableHead>
                    <TableHead>Associated Tags</TableHead>
                    <TableHead>Vendors</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServiceTypes.map((serviceType) => (
                    <TableRow key={serviceType.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          <span>{serviceType.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {serviceType.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tags className="mr-1 h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{serviceType.vendorCount}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredServiceTypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No service types found. Try a different search term or add a new service type.
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

export default ServiceTypesPage;
