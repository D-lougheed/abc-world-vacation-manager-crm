
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Tag,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";

export interface VendorFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
  commissionRate: number;
  priceRange: number;
  notes?: string;
}

interface ServiceType {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface VendorFormProps {
  isNewVendor: boolean;
  vendorId?: string;
  formData: VendorFormData;
  setFormData: React.Dispatch<React.SetStateAction<VendorFormData>>;
  serviceTypes: ServiceType[];
  setServiceTypes: React.Dispatch<React.SetStateAction<ServiceType[]>>;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  onSave: () => Promise<void>;
  saving: boolean;
}

const VendorForm = ({
  isNewVendor,
  formData,
  setFormData,
  serviceTypes,
  setServiceTypes,
  tags,
  setTags,
  onSave,
  saving
}: VendorFormProps) => {
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [availableServiceTypes, setAvailableServiceTypes] = useState<ServiceType[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newServiceTypeName, setNewServiceTypeName] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch all service types and tags for dropdown options
        const { data: serviceTypesData, error: serviceTypesError } = await supabase
          .from('service_types')
          .select('id, name')
          .order('name');
        
        if (serviceTypesError) throw serviceTypesError;
        setAvailableServiceTypes(serviceTypesData || []);
        
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('id, name')
          .order('name');
        
        if (tagsError) throw tagsError;
        setAvailableTags(tagsData || []);
      } catch (error: any) {
        console.error('Error fetching form options:', error);
        toast({
          title: "Error loading form options",
          description: error.message,
          variant: "destructive"
        });
      }
    };
    
    fetchOptions();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'commissionRate') {
      // Parse commission rate as a number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) || value === '') {
        setFormData(prevData => ({
          ...prevData,
          [name]: value === '' ? 0 : numValue
        }));
      }
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handlePriceRangeChange = (value: number[]) => {
    setFormData(prevData => ({
      ...prevData,
      priceRange: value[0]
    }));
  };

  const handleAddServiceType = () => {
    if (selectedServiceType) {
      const serviceType = availableServiceTypes.find(st => st.id === selectedServiceType);
      if (serviceType && !serviceTypes.some(st => st.id === serviceType.id)) {
        setServiceTypes(prev => [...prev, serviceType]);
      }
      setSelectedServiceType("");
    }
  };

  const handleAddTag = () => {
    if (selectedTag) {
      const tag = availableTags.find(t => t.id === selectedTag);
      if (tag && !tags.some(t => t.id === tag.id)) {
        setTags(prev => [...prev, tag]);
      }
      setSelectedTag("");
    }
  };

  const handleRemoveServiceType = (serviceTypeId: string) => {
    setServiceTypes(prev => prev.filter(st => st.id !== serviceTypeId));
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(prev => prev.filter(t => t.id !== tagId));
  };

  // Function to render price range as dollar signs
  const renderPriceRange = (range: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={`text-lg ${i < range ? "text-primary" : "text-muted-foreground/30"}`}>$</span>
    ));
  };

  // Function to create a new service type (admin only)
  const handleCreateServiceType = async () => {
    if (!newServiceTypeName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a service type name",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert the new service type
      const { data: newServiceType, error } = await supabase
        .from('service_types')
        .insert([{ name: newServiceTypeName.trim() }])
        .select('id, name')
        .single();
      
      if (error) throw error;
      
      // Update the available service types
      setAvailableServiceTypes(prev => [...prev, newServiceType]);
      
      // Select the new service type
      setSelectedServiceType(newServiceType.id);
      
      // Clear the input
      setNewServiceTypeName("");
      
      toast({
        title: "Success",
        description: "New service type created successfully"
      });
    } catch (error: any) {
      console.error('Error creating service type:', error);
      toast({
        title: "Failed to create service type",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Vendor Name*</Label>
        <Input 
          id="name" 
          name="name" 
          value={formData.name} 
          onChange={handleInputChange} 
          placeholder="Enter vendor company name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contactPerson">Contact Person*</Label>
        <Input 
          id="contactPerson" 
          name="contactPerson" 
          value={formData.contactPerson} 
          onChange={handleInputChange}
          placeholder="Primary contact name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email*</Label>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <Input 
            id="email" 
            name="email" 
            type="email"
            value={formData.email} 
            onChange={handleInputChange}
            placeholder="contact@vendor.com"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone*</Label>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <Input 
            id="phone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleInputChange}
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-2" />
          <Input 
            id="address" 
            name="address" 
            value={formData.address} 
            onChange={handleInputChange}
            placeholder="123 Business Ave, City, State"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="serviceArea">Service Area</Label>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Input 
            id="serviceArea" 
            name="serviceArea" 
            value={formData.serviceArea} 
            onChange={handleInputChange}
            placeholder="Local, Regional, National, or Global"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Price Range</Label>
        <div className="space-y-2">
          <div className="pt-4">
            <Slider
              defaultValue={[formData.priceRange]}
              max={5}
              min={1}
              step={1}
              onValueChange={handlePriceRangeChange}
            />
          </div>
          <div className="flex justify-between">
            <div className="text-lg">{renderPriceRange(formData.priceRange)}</div>
            <p className="text-sm text-muted-foreground">{formData.priceRange} / 5</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="commissionRate">Commission Rate (%)</Label>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <Input 
            id="commissionRate" 
            name="commissionRate" 
            value={formData.commissionRate}
            onChange={handleInputChange}
            placeholder="Enter commission rate percentage"
            type="number"
            min="0"
            max="100"
            step="0.5"
          />
        </div>
      </div>

      {/* Service Types Selection */}
      <div className="space-y-2">
        <Label>Service Types</Label>
        <div className="flex flex-wrap gap-2">
          {serviceTypes.map(type => (
            <Badge key={type.id} className="bg-primary/20 text-primary hover:bg-primary/30 border-none flex items-center gap-1">
              {type.name}
              <button 
                type="button"
                onClick={() => handleRemoveServiceType(type.id)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Select
            value={selectedServiceType}
            onValueChange={setSelectedServiceType}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a service type" />
            </SelectTrigger>
            <SelectContent>
              {availableServiceTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            size="sm"
            onClick={handleAddServiceType}
            disabled={!selectedServiceType}
          >
            Add
          </Button>
        </div>

        {/* Admin-only service type creation */}
        <RoleBasedComponent requiredRole={UserRole.Admin}>
          <div className="mt-2 border-t pt-2">
            <p className="text-sm text-muted-foreground mb-2">Admin: Create new service type</p>
            <div className="flex gap-2">
              <Input
                value={newServiceTypeName}
                onChange={(e) => setNewServiceTypeName(e.target.value)}
                placeholder="New service type name"
                className="flex-1"
              />
              <Button 
                type="button" 
                size="sm"
                onClick={handleCreateServiceType}
                disabled={!newServiceTypeName.trim()}
                variant="outline"
              >
                Create
              </Button>
            </div>
          </div>
        </RoleBasedComponent>
      </div>

      {/* Tags Selection */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3 mr-1" />
              {tag.name}
              <button 
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-secondary/80 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Select
            value={selectedTag}
            onValueChange={setSelectedTag}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tag" />
            </SelectTrigger>
            <SelectContent>
              {availableTags.map(tag => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            size="sm"
            onClick={handleAddTag}
            disabled={!selectedTag}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea 
          id="notes" 
          name="notes" 
          value={formData.notes || ''} 
          onChange={handleInputChange}
          placeholder="Add any additional information about this vendor"
          className="min-h-[100px]"
        />
      </div>

      <Button onClick={onSave} disabled={saving} className="w-full mt-6">
        {saving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {isNewVendor ? "Create Vendor" : "Save Changes"}
          </>
        )}
      </Button>
    </div>
  );
};

export default VendorForm;
