
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { LocationTag } from '@/types';

interface UseBookingFormProps {
  initialData?: any;
  bookingId?: string;
}

export const useBookingForm = ({ initialData, bookingId }: UseBookingFormProps) => {
  const [locationTags, setLocationTags] = useState<LocationTag[]>([]);
  const [selectedLocationTag, setSelectedLocationTag] = useState<LocationTag | null>(null);
  const [vendorLocationTag, setVendorLocationTag] = useState<LocationTag | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch location tags
  useEffect(() => {
    const fetchLocationTags = async () => {
      try {
        const { data, error } = await supabase
          .from('location_tags')
          .select('*')
          .order('continent, country, state_province, city');
        
        if (error) throw error;
        setLocationTags(data || []);
      } catch (error: any) {
        console.error('Error fetching location tags:', error);
        toast({
          title: "Error",
          description: "Failed to load location tags",
          variant: "destructive"
        });
      }
    };

    fetchLocationTags();
  }, [toast]);

  // Set initial location tag if provided
  useEffect(() => {
    if (initialData?.locationTagId && locationTags.length > 0) {
      const locationTag = locationTags.find(lt => lt.id === initialData.locationTagId);
      setSelectedLocationTag(locationTag || null);
    }
  }, [initialData, locationTags]);

  // Fetch vendor's location tag when vendor changes
  const fetchVendorLocationTag = async (vendorId: string) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('location_tag_id, location_tags(*)')
        .eq('id', vendorId)
        .single();
      
      if (error) throw error;
      
      if (data?.location_tags) {
        setVendorLocationTag(data.location_tags as LocationTag);
      } else {
        setVendorLocationTag(null);
      }
    } catch (error: any) {
      console.error('Error fetching vendor location tag:', error);
    }
  };

  const handleLocationTagChange = (locationTag: LocationTag | null) => {
    setSelectedLocationTag(locationTag);
  };

  const useVendorLocation = () => {
    if (vendorLocationTag) {
      setSelectedLocationTag(vendorLocationTag);
      return vendorLocationTag;
    }
    return null;
  };

  return {
    locationTags,
    selectedLocationTag,
    vendorLocationTag,
    handleLocationTagChange,
    fetchVendorLocationTag,
    useVendorLocation
  };
};
