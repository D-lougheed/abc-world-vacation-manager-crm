import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LocationTag } from "@/types";

interface VendorFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
  priceRange: number;
  notes?: string;
  locationTagId?: string;
}

interface ServiceType {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface ServiceTypeCommission {
  service_type_id: string;
  commission_rate: number;
}

interface Booking {
  id: string;
  start_date: string;
  cost: number;
  commission_amount: number;
  booking_status: string;
  location: string;
  service_types: {
    name: string;
  };
  rating?: number;
}

interface Document {
  id: string;
  file_name: string;
  uploaded_at: string;
}

interface UseVendorDataReturn {
  loading: boolean;
  formData: VendorFormData;
  setFormData: React.Dispatch<React.SetStateAction<VendorFormData>>;
  serviceTypes: ServiceType[];
  setServiceTypes: React.Dispatch<React.SetStateAction<ServiceType[]>>;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  availableServiceTypes: ServiceType[];
  availableTags: Tag[];
  bookings: Booking[];
  documents: Document[];
  vendorRating: number;
  serviceTypeCommissions: ServiceTypeCommission[];
  setServiceTypeCommissions: React.Dispatch<React.SetStateAction<ServiceTypeCommission[]>>;
  defaultCommissionRate: number;
  locationTags: LocationTag[];
  selectedLocationTag: LocationTag | null;
  setSelectedLocationTag: React.Dispatch<React.SetStateAction<LocationTag | null>>;
}

const DEFAULT_VENDOR_COMMISSION_KEY = "default_vendor_commission_percentage";

export const useVendorData = (vendorId: string | undefined, isNewVendor: boolean): UseVendorDataReturn => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(10);
  const [formData, setFormData] = useState<VendorFormData>({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    serviceArea: "Local",
    priceRange: 3,
    notes: "",
    locationTagId: undefined
  });
  
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<ServiceType[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vendorRating, setVendorRating] = useState<number>(0);
  const [serviceTypeCommissions, setServiceTypeCommissions] = useState<ServiceTypeCommission[]>([]);
  const [locationTags, setLocationTags] = useState<LocationTag[]>([]);
  const [selectedLocationTag, setSelectedLocationTag] = useState<LocationTag | null>(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        
        // Fetch default commission rate from system settings
        let initialCommissionRate = 10; // Default fallback
        try {
          const { data: commissionSetting, error: commissionError } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", DEFAULT_VENDOR_COMMISSION_KEY)
            .maybeSingle();

          if (commissionError) {
            console.warn("Could not fetch default vendor commission setting:", commissionError.message);
          } else if (commissionSetting && commissionSetting.value) {
            const parsedCommission = parseFloat(commissionSetting.value);
            if (!isNaN(parsedCommission)) {
              initialCommissionRate = parsedCommission;
            }
          }
        } catch (error: any) {
          console.warn("Error fetching default vendor commission:", error.message);
        }
        
        setDefaultCommissionRate(initialCommissionRate);
        
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

        // Fetch location tags
        const { data: locationTagsData, error: locationTagsError } = await supabase
          .from('location_tags')
          .select('*')
          .order('continent, country, state_province, city');
        
        if (locationTagsError) throw locationTagsError;
        setLocationTags(locationTagsData || []);

        // For existing vendor, fetch vendor data
        if (!isNewVendor && vendorId) {
          // Fetch vendor
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', vendorId)
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
              priceRange: vendorData.price_range,
              notes: vendorData.notes || "",
              locationTagId: vendorData.location_tag_id || undefined
            });
            
            // Set selected location tag if vendor has one
            if (vendorData.location_tag_id) {
              const locationTag = locationTagsData?.find(lt => lt.id === vendorData.location_tag_id);
              setSelectedLocationTag(locationTag || null);
            }
            
            // Store vendor rating
            setVendorRating(vendorData.rating || 0);
            
            // Fetch service types for this vendor
            const { data: vendorServiceTypes, error: vendorServiceTypesError } = await supabase
              .from('vendor_service_types')
              .select('service_type_id')
              .eq('vendor_id', vendorId);
            
            if (vendorServiceTypesError) throw vendorServiceTypesError;
            
            if (vendorServiceTypes && vendorServiceTypes.length > 0) {
              const serviceTypeIds = vendorServiceTypes.map(relation => relation.service_type_id);
              const { data: serviceTypesData, error: serviceTypesError } = await supabase
                .from('service_types')
                .select('id, name')
                .in('id', serviceTypeIds);
              
              if (serviceTypesError) throw serviceTypesError;
              
              if (serviceTypesData) {
                setServiceTypes(serviceTypesData);
              }
            }
            
            // Fetch tags for this vendor
            const { data: vendorTags, error: vendorTagsError } = await supabase
              .from('vendor_tags')
              .select('tag_id')
              .eq('vendor_id', vendorId);
            
            if (vendorTagsError) throw vendorTagsError;
            
            if (vendorTags && vendorTags.length > 0) {
              const tagIds = vendorTags.map(relation => relation.tag_id);
              const { data: tagsData, error: tagsError } = await supabase
                .from('tags')
                .select('id, name')
                .in('id', tagIds);
              
              if (tagsError) throw tagsError;
              
              if (tagsData) {
                setTags(tagsData);
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
                rating,
                location,
                service_types:service_type_id(name)
              `)
              .eq('vendor_id', vendorId)
              .order('start_date', { ascending: false })
              .limit(5);
            
            if (bookingsError) throw bookingsError;
            setBookings(bookingsData || []);
            
            // Fetch documents for this vendor
            const { data: documentsData, error: documentsError } = await supabase
              .from('vendor_files')
              .select('*')
              .eq('vendor_id', vendorId);
            
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
  }, [vendorId, isNewVendor, toast]);

  return {
    loading,
    formData,
    setFormData,
    serviceTypes,
    setServiceTypes,
    tags,
    setTags,
    availableServiceTypes,
    availableTags,
    bookings,
    documents,
    vendorRating,
    serviceTypeCommissions,
    setServiceTypeCommissions,
    defaultCommissionRate,
    locationTags,
    selectedLocationTag,
    setSelectedLocationTag
  };
};
