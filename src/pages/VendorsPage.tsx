
import { useState } from "react";
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

const VendorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Dummy data - in a real app, this would come from your database
  const vendors = [
    { id: "1", name: "Marriott Hotels", contactPerson: "Sarah Johnson", serviceTypes: ["Accommodation"], tags: ["Luxury", "Business"], priceRange: 4, commissionRate: 10, rating: 4.8 },
    { id: "2", name: "Delta Airlines", contactPerson: "Michael Chen", serviceTypes: ["Transportation", "Flights"], tags: ["International", "Domestic"], priceRange: 3, commissionRate: 8, rating: 4.5 },
    { id: "3", name: "Hertz Car Rental", contactPerson: "David Wilson", serviceTypes: ["Transportation"], tags: ["Luxury", "Economy"], priceRange: 3, commissionRate: 12, rating: 4.2 },
    { id: "4", name: "Royal Caribbean", contactPerson: "Emma Davis", serviceTypes: ["Cruise"], tags: ["Luxury", "All-Inclusive"], priceRange: 5, commissionRate: 15, rating: 4.9 },
    { id: "5", name: "City Tours Inc", contactPerson: "Robert Brown", serviceTypes: ["Activities", "Tours"], tags: ["Group", "Private"], priceRange: 2, commissionRate: 18, rating: 4.6 },
  ];

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
                {filteredVendors.map((vendor) => (
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
                ))}
                {filteredVendors.length === 0 && (
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
