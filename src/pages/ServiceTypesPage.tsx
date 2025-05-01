
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Tag {
  id: string;
  name: string;
}

interface ServiceType {
  id: string;
  name: string;
  tags: Tag[];
  vendorCount: number;
}

const ServiceTypesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch service types from Supabase
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        setLoading(true);
        
        // Fetch service types
        const { data: serviceTypesData, error: serviceTypesError } = await supabase
          .from('service_types')
          .select('*')
          .order('name');
        
        if (serviceTypesError) throw serviceTypesError;
        
        // For each service type, fetch associated tags and vendor count
        const serviceTypesWithDetails = await Promise.all(serviceTypesData.map(async (serviceType) => {
          // Fetch tags for this service type
          const { data: tagRelations, error: tagRelationsError } = await supabase
            .from('service_type_tags')
            .select('tag_id')
            .eq('service_type_id', serviceType.id);
          
          if (tagRelationsError) throw tagRelationsError;
          
          let tags: Tag[] = [];
          if (tagRelations.length > 0) {
            const tagIds = tagRelations.map(relation => relation.tag_id);
            const { data: tagsData, error: tagsError } = await supabase
              .from('tags')
              .select('*')
              .in('id', tagIds);
            
            if (tagsError) throw tagsError;
            tags = tagsData;
          }
          
          // Count vendors using this service type
          const { count: vendorCount, error: vendorCountError } = await supabase
            .from('vendor_service_types')
            .select('vendor_id', { count: 'exact', head: true })
            .eq('service_type_id', serviceType.id);
          
          if (vendorCountError) throw vendorCountError;
          
          return {
            id: serviceType.id,
            name: serviceType.name,
            tags: tags,
            vendorCount: vendorCount || 0
          };
        }));
        
        setServiceTypes(serviceTypesWithDetails);
      } catch (error: any) {
        console.error('Error fetching service types:', error);
        toast({
          title: "Failed to load service types",
          description: error.message || "There was an error loading the service type data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServiceTypes();
  }, [toast]);

  // Filter service types based on search term
  const filteredServiceTypes = serviceTypes.filter((serviceType) => {
    const name = serviceType.name.toLowerCase();
    const tags = serviceType.tags.map(tag => tag.name).join(" ").toLowerCase();
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading service types...
                      </TableCell>
                    </TableRow>
                  ) : filteredServiceTypes.length > 0 ? (
                    filteredServiceTypes.map((serviceType) => (
                      <TableRow key={serviceType.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary" />
                            <span>{serviceType.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {serviceType.tags.map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                <Tags className="mr-1 h-3 w-3" />
                                {tag.name}
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
                    ))
                  ) : (
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
