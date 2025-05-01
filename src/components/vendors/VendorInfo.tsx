
import { CreditCard, Globe, Mail, MapPin, Phone, Star, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface VendorInfoProps {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
  commissionRate: number;
  priceRange: number;
  serviceTypes: { id: string; name: string; }[];
  tags: { id: string; name: string; }[];
  notes?: string;
  rating?: number;
}

const VendorInfo = ({
  name,
  contactPerson,
  email,
  phone,
  address,
  serviceArea,
  commissionRate,
  priceRange,
  serviceTypes,
  tags,
  notes,
  rating
}: VendorInfoProps) => {
  // Function to render price range as dollar signs
  const renderPriceRange = (range: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={`text-lg ${i < range ? "text-primary" : "text-muted-foreground/30"}`}>$</span>
    ));
  };

  // Function to render rating as stars
  const renderRating = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-muted-foreground/30" />);
      }
    }

    return (
      <div className="flex items-center">
        <div className="flex mr-1">{stars}</div>
        <span>({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">Contact Person</h3>
          <p className="font-medium">{contactPerson}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">Price Range</h3>
          <p>{renderPriceRange(priceRange)}</p>
        </div>
      </div>
      
      {rating !== undefined && rating > 0 && (
        <div className="pt-2 border-t">
          <h3 className="font-medium text-sm text-muted-foreground">Rating</h3>
          {renderRating(rating)}
        </div>
      )}
      
      <div className="pt-2 border-t">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <p>{email}</p>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <p>{phone}</p>
        </div>
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p>{address || "No address provided"}</p>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <p>{serviceArea}</p>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <p className="font-medium">{commissionRate}% Commission Rate</p>
        </div>
      </div>
      
      <div className="pt-2 border-t">
        <h3 className="font-medium text-sm text-muted-foreground mb-2">Service Types</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {serviceTypes.length > 0 ? (
            serviceTypes.map(type => (
              <Badge key={type.id} className="bg-primary/20 text-primary hover:bg-primary/30 border-none">
                {type.name}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No service types assigned</p>
          )}
        </div>
      </div>
      
      <div className="pt-2 border-t">
        <h3 className="font-medium text-sm text-muted-foreground mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map(tag => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag.name}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No tags assigned</p>
          )}
        </div>
      </div>
      
      {notes && (
        <div className="pt-2 border-t">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">Notes</h3>
          <p className="text-sm">{notes}</p>
        </div>
      )}
    </div>
  );
};

export default VendorInfo;
