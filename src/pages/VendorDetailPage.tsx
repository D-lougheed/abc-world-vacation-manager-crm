
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Star,
  Tag,
  FileText,
  Edit,
  Upload,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";

const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [notes, setNotes] = useState("Preferred vendor for luxury hotel bookings. Special agent rates available. Contact Sarah for VIP client arrangements.");

  // In a real app, you would fetch vendor data based on the ID
  const vendor = {
    id: id || "1",
    name: "Marriott Hotels",
    contactPerson: "Sarah Johnson",
    email: "sarah.johnson@marriott.com",
    phone: "+1 (555) 123-4567",
    address: "123 Hotel Avenue, Chicago, IL 60601",
    serviceTypes: ["Accommodation", "Conference"],
    serviceArea: "Global",
    commissionRate: 10,
    priceRange: 4,
    rating: 4.8,
    tags: ["Luxury", "Business", "Family-Friendly", "Rewards Program"],
    bookings: [
      { id: "1", client: "Smith Family", service: "Hotel in Paris", date: "2023-06-15", cost: 1200, commission: 120, status: "Confirmed" },
      { id: "2", client: "Johnson Group", service: "Conference Room", date: "2023-07-10", cost: 850, commission: 85, status: "Pending" },
      { id: "3", client: "Wilson Party", service: "Resort Stay in Hawaii", date: "2023-08-05", cost: 3500, commission: 350, status: "Confirmed" },
    ],
    documents: [
      { id: "1", name: "Vendor Agreement.pdf", uploadDate: "2023-01-15" },
      { id: "2", name: "Rate Sheet 2023.pdf", uploadDate: "2023-01-15" },
      { id: "3", name: "Commission Terms.pdf", uploadDate: "2023-01-15" },
    ]
  };

  // Function to render price range as dollar signs
  const renderPriceRange = (range: number) => {
    return Array(range).fill(0).map((_, i) => (
      <span key={i} className="text-primary">$</span>
    ));
  };

  // Function to render rating as stars
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 text-yellow-400" />);
    }

    return (
      <div className="flex items-center">
        <div className="flex mr-1">{stars}</div>
        <span>({rating})</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{vendor.name}</h1>
            <p className="text-sm text-muted-foreground">Contact: {vendor.contactPerson}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <RoleBasedComponent requiredRole={UserRole.Admin}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Vendor
            </Button>
          </RoleBasedComponent>
          <Button variant="outline">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Create Booking
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Contact Person</dt>
                <dd>{vendor.contactPerson}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">{vendor.email}</a>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                <dd className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${vendor.phone}`} className="hover:underline">{vendor.phone}</a>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                <dd className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{vendor.address}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Service Area</dt>
                <dd className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.serviceArea}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Service Types</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {vendor.serviceTypes.map((type) => (
                    <Badge key={type} className="bg-primary/20 text-primary hover:bg-primary/30 border-none">{type}</Badge>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Commission Rate</dt>
                <dd className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">{vendor.commissionRate}%</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Price Range</dt>
                <dd className="font-semibold">{renderPriceRange(vendor.priceRange)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Rating</dt>
                <dd>{renderRating(vendor.rating)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tags</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {vendor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Notes</span>
                  <RoleBasedComponent requiredRole={UserRole.Admin}>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </RoleBasedComponent>
                </dt>
                <dd className="mt-1">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                    readOnly={!RoleBasedComponent}
                  />
                </dd>
              </div>
              <div>
                <dt className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Documents</span>
                  <RoleBasedComponent requiredRole={UserRole.Admin}>
                    <Button variant="ghost" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </RoleBasedComponent>
                </dt>
                <dd>
                  <div className="space-y-2">
                    {vendor.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{doc.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 md:col-span-2">
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
            <CardDescription>Past and upcoming bookings with this vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vendor.bookings.length > 0 ? (
                vendor.bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{booking.service}</p>
                      <div className="text-sm text-muted-foreground">
                        {booking.client} • {new Date(booking.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">${booking.cost}</p>
                        <p className="text-xs text-primary">${booking.commission} commission</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        booking.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">No bookings found for this vendor.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDetailPage;
