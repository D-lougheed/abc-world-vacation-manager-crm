
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Briefcase, 
  Star,
  DollarSign,
  Loader2
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
import VendorFilters, { VendorFilters as VendorFiltersType } from "@/components/vendors/VendorFilters";

// Modified interface that doesn't extend Vendor to avoid type conflicts
interface VendorWithDetails {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
  commissionRate: number;
  priceRange: number;
  rating: number;
  serviceTypes: string[];
  tags: string[];
  notes?: string;
}

const VendorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState<VendorWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypesList, setServiceTypesList] = useState<{ id: string; name: string }[]>([]);
  const [tagsList, setTagsList] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<VendorFiltersType>({
    serviceTypes: [],
    priceRange: [1, 5],
    commissionRange: [0, 100],
    ratingMinimum: 0,
    tags: [],
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch vendors from Supabase
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        
        // Fetch all available service types and tags for filters
        const [serviceTypesResponse, tagsResponse] = await Promise.all([
          supabase.from('service_types').select('id, name').order('name'),
          supabase.from('tags').select('id, name').order('name')
        ]);
        
        if (serviceTypesResponse.error) throw serviceTypesResponse.error;
        if (tagsResponse.error) throw tagsResponse.error;
        
        setServiceTypesList(serviceTypesResponse.data || []);
        setTagsList(tagsResponse.data || []);
        
        // Fetch vendors
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendors')
          .select('*')
          .order('name');
        
        if (vendorsError) throw vendorsError;
        
        // For each vendor, fetch associated service types and tags
        const vendorsWithDetails = await Promise.all((vendorsData || []).map(async (vendor) => {
          // Fetch service types for this vendor
          const { data: vendorServiceTypes, error: vendorServiceTypesError } = await supabase
            .from('vendor_service_types')
            .select('service_type_id')
            .eq('vendor_id', vendor.id);
          
          if (vendorServiceTypesError) console.error('Error fetching vendor service types:', vendorServiceTypesError);
          
          let serviceTypes: string[] = [];
          if (vendorServiceTypes && vendorServiceTypes.length > 0) {
            const serviceTypeIds = vendorServiceTypes.map(relation => relation.service_type_id);
            const { data: serviceTypesData, error: serviceTypesError } = await supabase
              .from('service_types')
              .select('name')
              .in('id', serviceTypeIds);
            
            if (serviceTypesError) console.error('Error fetching service types:', serviceTypesError);
            serviceTypes = serviceTypesData ? serviceTypesData.map(st => st.name) : [];
          }
          
          // Fetch tags for this vendor
          const { data: vendorTags, error: vendorTagsError } = await supabase
            .from('vendor_tags')
            .select('tag_id')
            .eq('vendor_id', vendor.id);
          
          if (vendorTagsError) console.error('Error fetching vendor tags:', vendorTagsError);
          
          let tags: string[] = [];
          if (vendorTags && vendorTags.length > 0) {
            const tagIds = vendorTags.map(relation => relation.tag_id);
            const { data: tagsData, error: tagsError } = await supabase
              .from('tags')
              .select('name')
              .in('id', tagIds);
            
            if (tagsError) console.error('Error fetching tags:', tagsError);
            tags = tagsData ? tagsData.map(tag => tag.name) : [];
          }
          
          return {
            id: vendor.id,
            name: vendor.name,
            contactPerson: vendor.contact_person,
            serviceTypes,
            tags,
            priceRange: vendor.price_range,
            commissionRate: vendor.commission_rate,
            rating: vendor.rating || 0,
            email: vendor.email,
            phone: vendor.phone,
            address: vendor.address,
            serviceArea: vendor.service_area,
            notes: vendor.notes
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

  // Handle filter changes
  const handleFilterChange = (newFilters: VendorFiltersType) => {
    setFilters(newFilters);
  };

  // Filter vendors based on search term and filters
  const filteredVendors = vendors.filter((vendor) => {
    // Text search filter
    const textMatch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.serviceTypes.some(type => type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      vendor.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!textMatch) return false;
    
    // Service type filter
    if (filters.serviceTypes.length > 0 && !vendor.serviceTypes.some(type => filters.serviceTypes.includes(type))) {
      return false;
    }
    
    // Price range filter
    if (vendor.priceRange < filters.priceRange[0] || vendor.priceRange > filters.priceRange[1]) {
      return false;
    }
    
    // Commission rate filter
    if (vendor.commissionRate < filters.commissionRange[0] || vendor.commissionRate > filters.commissionRange[1]) {
      return false;
    }
    
    // Rating filter
    if (vendor.rating < filters.ratingMinimum) {
      return false;
    }
    
    // Tags filter
    if (filters.tags.length > 0 && !vendor.tags.some(tag => filters.tags.includes(tag))) {
      return false;
    }
    
    return true;
  });

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
            <VendorFilters 
              serviceTypes={serviceTypesList}
              tags={tagsList}
              onFilterChange={handleFilterChange}
              activeFilters={filters}
            />
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
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span>Loading vendors...</span>
                      </div>
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
                          <DollarSign className="mr-1 h-4 w-4" />
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
                      No vendors found. Try a different search term or adjust your filters.
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
