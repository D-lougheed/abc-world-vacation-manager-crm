
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Briefcase, 
  Plus,
  Filter,
  Star,
  DollarSign,
  Tag,
  CreditCard
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
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ServiceType {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  serviceTypes: string[];
  tags: string[];
  priceRange: number;
  commissionRate: number;
  rating: number;
}

const VendorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch vendors from Supabase
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        
        // Fetch vendors
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendors')
          .select('*')
          .order('name');
        
        if (vendorsError) throw vendorsError;
        
        // For each vendor, fetch associated service types and tags
        const vendorsWithDetails = await Promise.all(vendorsData.map(async (vendor) => {
          // Fetch service types for this vendor
          const { data: vendorServiceTypes, error: vendorServiceTypesError } = await supabase
            .from('vendor_service_types')
            .select('service_type_id')
            .eq('vendor_id', vendor.id);
          
          if (vendorServiceTypesError) throw vendorServiceTypesError;
          
          let serviceTypes: string[] = [];
          if (vendorServiceTypes.length > 0) {
            const serviceTypeIds = vendorServiceTypes.map(relation => relation.service_type_id);
            const { data: serviceTypesData, error: serviceTypesError } = await supabase
              .from('service_types')
              .select('name')
              .in('id', serviceTypeIds);
            
            if (serviceTypesError) throw serviceTypesError;
            serviceTypes = serviceTypesData.map(st => st.name);
          }
          
          // Fetch tags for this vendor
          const { data: vendorTags, error: vendorTagsError } = await supabase
            .from('vendor_tags')
            .select('tag_id')
            .eq('vendor_id', vendor.id);
          
          if (vendorTagsError) throw vendorTagsError;
          
          let tags: string[] = [];
          if (vendorTags.length > 0) {
            const tagIds = vendorTags.map(relation => relation.tag_id);
            const { data: tagsData, error: tagsError } = await supabase
              .from('tags')
              .select('name')
              .in('id', tagIds);
            
            if (tagsError) throw tagsError;
            tags = tagsData.map(tag => tag.name);
          }
          
          return {
            id: vendor.id,
            name: vendor.name,
            contactPerson: vendor.contact_person,
            serviceTypes: serviceTypes,
            tags: tags,
            priceRange: vendor.price_range,
            commissionRate: vendor.commission_rate,
            rating: vendor.rating
          };
        }));
        
        setVendors(vendorsWithDetails);
      } catch (error: any) {
        console.error('Error fetching vendors:', error);
        toast({
          title: "Failed to load vendors",
          description: error.message || "There was an error loading vendor data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [toast]);

  // Filter vendors based on search term
  const filteredVendors = vendors.filter((vendor) => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.serviceTypes.some(type => type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    vendor.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Function to render price range as dollar signs
  const renderPriceRange = (range: number) => {
    return Array(range).fill(0).map((_, i) => (
      <DollarSign key={i} className="h-4 w-4 inline text-muted-foreground" />
    ));
  };

  // Function to render rating as stars
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 inline fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 inline text-yellow-400" />);
    }

    return (
      <div className="flex items-center">
        <div className="mr-1">{stars}</div>
        <span className="text-sm">({rating})</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <RoleBasedComponent requiredRole={UserRole.Admin}>
          <Button onClick={() => navigate("/vendors/new")}>
            <Briefcase className="mr-2 h-4 w-4" />
            Add New Vendor
          </Button>
        </RoleBasedComponent>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Manage your travel partners and service providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Service Types</TableHead>
                  <TableHead>Price Range</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading vendors...
                    </TableCell>
                  </TableRow>
                ) : filteredVendors.length > 0 ? (
                  filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/vendors/${vendor.id}`)}>
                      <TableCell>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                      </TableCell>
                      <TableCell>
                        {vendor.serviceTypes.map((type) => (
                          <Badge key={type} variant="outline" className="mr-1 mb-1">{type}</Badge>
                        ))}
                      </TableCell>
                      <TableCell>{renderPriceRange(vendor.priceRange)}</TableCell>
                      <TableCell className="font-medium text-primary">
                        <div className="flex items-center">
                          <CreditCard className="mr-1 h-4 w-4" />
                          {vendor.commissionRate}%
                        </div>
                      </TableCell>
                      <TableCell>{renderRating(vendor.rating)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {vendor.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No vendors found. Try a different search term or add a new vendor.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorsPage;
