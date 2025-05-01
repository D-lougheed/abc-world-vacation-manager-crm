
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Save,
  Trash2,
  X,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface VendorFormData {
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

const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const isNewVendor = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(isNewVendor);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // State for vendor form
  const [formData, setFormData] = useState<VendorFormData>({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    serviceArea: "Local",
    commissionRate: 10,
    priceRange: 3,
    notes: ""
  });

  // State for service types and tags
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [availableServiceTypes, setAvailableServiceTypes] = useState<Array<{id: string, name: string}>>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string}>>([]);
  
  // State for bookings and documents
  const [bookings, setBookings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Fetch vendor data if not a new vendor
  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        
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
        
        // For existing vendor, fetch vendor data
        if (!isNewVendor) {
          // Fetch vendor
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', id)
            .single();
          
          if (vendorError) throw vendorError;
          
          if (vendorData) {
            setFormData({
              name: vendorData.name,
              contactPerson: vendorData.contact_person,
              email: vendorData.email,
              phone: vendorData.phone,
              address: vendorData.address,
              serviceArea: vendorData.service_area,
              commissionRate: vendorData.commission_rate,
              priceRange: vendorData.price_range,
              notes: vendorData.notes || ""
            });
            
            // Fetch service types for this vendor
            const { data: vendorServiceTypes, error: vendorServiceTypesError } = await supabase
              .from('vendor_service_types')
              .select('service_type_id')
              .eq('vendor_id', id);
            
            if (vendorServiceTypesError) throw vendorServiceTypesError;
            
            if (vendorServiceTypes && vendorServiceTypes.length > 0) {
              const serviceTypeIds = vendorServiceTypes.map(relation => relation.service_type_id);
              const { data: serviceTypesData, error: serviceTypesError } = await supabase
                .from('service_types')
                .select('name')
                .in('id', serviceTypeIds);
              
              if (serviceTypesError) throw serviceTypesError;
              
              if (serviceTypesData) {
                setServiceTypes(serviceTypesData.map(st => st.name));
              }
            }
            
            // Fetch tags for this vendor
            const { data: vendorTags, error: vendorTagsError } = await supabase
              .from('vendor_tags')
              .select('tag_id')
              .eq('vendor_id', id);
            
            if (vendorTagsError) throw vendorTagsError;
            
            if (vendorTags && vendorTags.length > 0) {
              const tagIds = vendorTags.map(relation => relation.tag_id);
              const { data: tagsData, error: tagsError } = await supabase
                .from('tags')
                .select('name')
                .in('id', tagIds);
              
              if (tagsError) throw tagsError;
              
              if (tagsData) {
                setTags(tagsData.map(tag => tag.name));
              }
            }
            
            // Fetch bookings for this vendor
            const { data: bookingsData, error: bookingsError } = await supabase
              .from('bookings')
              .select(`
                id, 
                start_date, 
                cost, 
                commission_amount, 
                booking_status, 
                location,
                service_types:service_type_id(name)
              `)
              .eq('vendor_id', id)
              .order('start_date', { ascending: false })
              .limit(5);
            
            if (bookingsError) throw bookingsError;
            setBookings(bookingsData || []);
            
            // Fetch documents for this vendor
            const { data: documentsData, error: documentsError } = await supabase
              .from('vendor_files')
              .select('*')
              .eq('vendor_id', id);
            
            if (documentsError) throw documentsError;
            setDocuments(documentsData || []);
          }
        }
      } catch (error: any) {
        console.error('Error fetching vendor data:', error);
        toast({
          title: "Error loading vendor data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendorData();
  }, [id, isNewVendor, toast]);

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
    if (selectedServiceType && !serviceTypes.includes(selectedServiceType)) {
      setServiceTypes(prev => [...prev, selectedServiceType]);
      setSelectedServiceType("");
    }
  };

  const handleAddTag = () => {
    if (selectedTag && !tags.includes(selectedTag)) {
      setTags(prev => [...prev, selectedTag]);
      setSelectedTag("");
    }
  };

  const handleRemoveServiceType = (serviceType: string) => {
    setServiceTypes(prev => prev.filter(st => st !== serviceType));
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleDeleteVendor = async () => {
    try {
      setSaving(true);
      
      // First delete vendor relationships
      await supabase.from('vendor_service_types').delete().eq('vendor_id', id);
      await supabase.from('vendor_tags').delete().eq('vendor_id', id);
      await supabase.from('vendor_files').delete().eq('vendor_id', id);
      
      // Then delete the vendor
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Vendor deleted",
        description: "The vendor has been successfully removed"
      });
      
      navigate('/vendors');
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Failed to delete vendor",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSaveVendor = async () => {
    try {
      setSaving(true);
      
      // Validate form data
      if (!formData.name || !formData.contactPerson || !formData.email || !formData.phone) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }
      
      // Prepare vendor data
      const vendorData = {
        name: formData.name,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        service_area: formData.serviceArea,
        commission_rate: formData.commissionRate,
        price_range: formData.priceRange,
        notes: formData.notes
      };
      
      let vendorId = id;
      
      if (isNewVendor) {
        // Insert new vendor
        const { data: newVendor, error: insertError } = await supabase
          .from('vendors')
          .insert(vendorData)
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        vendorId = newVendor.id;
        
        toast({
          title: "Vendor created",
          description: `${formData.name} has been added to your vendors`,
        });
      } else {
        // Update existing vendor
        const { error: updateError } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', id);
        
        if (updateError) throw updateError;
        
        toast({
          title: "Vendor updated",
          description: "Vendor information has been successfully updated",
        });
      }
      
      // Save service types for this vendor
      if (serviceTypes.length > 0 && vendorId) {
        // First delete existing relationships
        if (!isNewVendor) {
          const { error: deleteError } = await supabase
            .from('vendor_service_types')
            .delete()
            .eq('vendor_id', vendorId);
          
          if (deleteError) throw deleteError;
        }
        
        // Get the IDs of the service types by name
        const { data: serviceTypeData, error: serviceTypeError } = await supabase
          .from('service_types')
          .select('id')
          .in('name', serviceTypes);
        
        if (serviceTypeError) throw serviceTypeError;
        
        if (serviceTypeData && serviceTypeData.length > 0) {
          // Insert new service type relationships
          const vendorServiceTypes = serviceTypeData.map(st => ({
            vendor_id: vendorId,
            service_type_id: st.id
          }));
          
          // Insert relationships one by one to avoid RLS issues
          for (const relation of vendorServiceTypes) {
            const { error: insertError } = await supabase
              .from('vendor_service_types')
              .insert(relation);
            
            if (insertError) {
              console.error('Error inserting vendor service type:', insertError);
              toast({
                title: "Warning",
                description: `Some service types may not have been saved: ${insertError.message}`,
                variant: "destructive"
              });
            }
          }
        }
      }
      
      // Save tags for this vendor
      if (tags.length > 0 && vendorId) {
        // First delete existing relationships
        if (!isNewVendor) {
          const { error: deleteError } = await supabase
            .from('vendor_tags')
            .delete()
            .eq('vendor_id', vendorId);
          
          if (deleteError) throw deleteError;
        }
        
        // Get the IDs of the tags by name
        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('id')
          .in('name', tags);
        
        if (tagError) throw tagError;
        
        if (tagData && tagData.length > 0) {
          // Insert new tag relationships one by one to avoid RLS issues
          for (const tag of tagData) {
            const { error: insertError } = await supabase
              .from('vendor_tags')
              .insert({
                vendor_id: vendorId,
                tag_id: tag.id
              });
            
            if (insertError) {
              console.error('Error inserting vendor tag:', insertError);
              toast({
                title: "Warning",
                description: `Some tags may not have been saved: ${insertError.message}`,
                variant: "destructive"
              });
            }
          }
        }
      }
      
      // Navigate to the vendor detail page if created new
      if (isNewVendor && vendorId) {
        navigate(`/vendors/${vendorId}`);
      } else {
        // Exit edit mode after saving
        setIsEditMode(false);
      }
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Failed to save vendor",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Function to render price range as dollar signs
  const renderPriceRange = (range: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={`text-lg ${i < range ? "text-primary" : "text-muted-foreground/30"}`}>$</span>
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{isNewVendor ? "New Vendor" : formData.name}</h1>
            <p className="text-sm text-muted-foreground">
              {isNewVendor ? "Create a new vendor" : `Contact: ${formData.contactPerson}`}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEditMode ? (
            <Button onClick={handleSaveVendor} disabled={saving}>
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
          ) : (
            <RoleBasedComponent requiredRole={UserRole.Admin}>
              <Button onClick={() => setIsEditMode(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Vendor
              </Button>
            </RoleBasedComponent>
          )}
          
          {!isNewVendor && !isEditMode && (
            <Button variant="outline">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Left column: Vendor information */}
        <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle>{isEditMode ? (isNewVendor ? "Vendor Information" : "Edit Vendor Information") : "Vendor Details"}</CardTitle>
            {isNewVendor && <CardDescription>Add details about this vendor</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isEditMode ? (
                <>
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
                        <Badge key={type} className="bg-primary/20 text-primary hover:bg-primary/30 border-none flex items-center gap-1">
                          {type}
                          <button 
                            type="button"
                            onClick={() => handleRemoveServiceType(type)}
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
                            <SelectItem key={type.id} value={type.name}>
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
                  </div>

                  {/* Tags Selection */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                          <button 
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
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
                            <SelectItem key={tag.id} value={tag.name}>
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
                </>
              ) : (
                // View mode
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Contact Person</h3>
                      <p className="font-medium">{formData.contactPerson}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Price Range</h3>
                      <p>{renderPriceRange(formData.priceRange)}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p>{formData.email}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p>{formData.phone}</p>
                    </div>
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p>{formData.address || "No address provided"}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <p>{formData.serviceArea}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <p className="font-medium">{formData.commissionRate}% Commission Rate</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Service Types</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {serviceTypes.length > 0 ? (
                        serviceTypes.map(type => (
                          <Badge key={type} className="bg-primary/20 text-primary hover:bg-primary/30 border-none">
                            {type}
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
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags assigned</p>
                      )}
                    </div>
                  </div>
                  
                  {formData.notes && (
                    <div className="pt-2 border-t">
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Notes</h3>
                      <p className="text-sm">{formData.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            {isEditMode ? (
              isNewVendor ? (
                <p className="text-sm text-muted-foreground">* Required fields</p>
              ) : (
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Vendor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Vendor</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this vendor? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteVendor}
                        disabled={saving}
                      >
                        {saving ? "Deleting..." : "Delete Vendor"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )
            ) : (
              <RoleBasedComponent requiredRole={UserRole.Admin}>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditMode(true)}
                  className="w-full"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Vendor Details
                </Button>
              </RoleBasedComponent>
            )}
          </CardFooter>
        </Card>
        
        {/* Right column: Split into two cards - Bookings and Documents */}
        {!isNewVendor && (
          <>
            {/* Bookings Card */}
            <Card className="col-span-3 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{booking.service_types?.name || "Service"}</p>
                          <div className="text-sm text-muted-foreground">
                            {booking.location} • {new Date(booking.start_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium">${booking.cost}</p>
                            <p className="text-xs text-primary">${booking.commission_amount} commission</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            booking.booking_status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {booking.booking_status}
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

            {/* Documents Card */}
            <Card className="col-span-3 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{doc.file_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No documents uploaded for this vendor.</p>
                      <Button variant="outline" className="mt-4">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorDetailPage;
