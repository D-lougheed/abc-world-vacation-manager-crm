
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface VendorFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
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

interface ServiceTypeCommission {
  service_type_id: string;
  commission_rate: number;
}

interface UseVendorActionsReturn {
  saving: boolean;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  handleSaveVendor: (serviceTypeCommissions?: ServiceTypeCommission[]) => Promise<void>;
  handleDeleteVendor: () => Promise<void>;
}

export const useVendorActions = (
  vendorId: string | undefined,
  isNewVendor: boolean,
  formData: VendorFormData,
  serviceTypes: ServiceType[],
  tags: Tag[]
): UseVendorActionsReturn => {
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSaveVendor = async (serviceTypeCommissions?: ServiceTypeCommission[]) => {
    try {
      setSaving(true);
      
      let savedVendorId = vendorId;
      
      if (isNewVendor) {
        // Create new vendor
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .insert({
            name: formData.name,
            contact_person: formData.contactPerson,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            service_area: formData.serviceArea,
            price_range: formData.priceRange,
            notes: formData.notes
          })
          .select()
          .single();
        
        if (vendorError) throw vendorError;
        savedVendorId = vendorData.id;
        
        toast({
          title: "Success",
          description: "Vendor created successfully",
          variant: "default"
        });
        
        // Navigate to the new vendor's page
        navigate(`/vendors/${savedVendorId}`);
      } else {
        // Update existing vendor
        const { error: vendorError } = await supabase
          .from('vendors')
          .update({
            name: formData.name,
            contact_person: formData.contactPerson,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            service_area: formData.serviceArea,
            price_range: formData.priceRange,
            notes: formData.notes
          })
          .eq('id', vendorId);
        
        if (vendorError) throw vendorError;
        
        toast({
          title: "Success",
          description: "Vendor updated successfully",
          variant: "default"
        });
      }
      
      if (savedVendorId) {
        // Handle service types
        await supabase.from('vendor_service_types').delete().eq('vendor_id', savedVendorId);
        
        if (serviceTypes.length > 0) {
          const serviceTypeRelations = serviceTypes.map(st => ({
            vendor_id: savedVendorId,
            service_type_id: st.id
          }));
          
          const { error: serviceTypesError } = await supabase
            .from('vendor_service_types')
            .insert(serviceTypeRelations);
          
          if (serviceTypesError) throw serviceTypesError;
        }
        
        // Handle tags
        await supabase.from('vendor_tags').delete().eq('vendor_id', savedVendorId);
        
        if (tags.length > 0) {
          const tagRelations = tags.map(tag => ({
            vendor_id: savedVendorId,
            tag_id: tag.id
          }));
          
          const { error: tagsError } = await supabase
            .from('vendor_tags')
            .insert(tagRelations);
          
          if (tagsError) throw tagsError;
        }
        
        // Handle service type commissions
        if (serviceTypeCommissions && serviceTypeCommissions.length > 0) {
          // Delete existing commissions
          await supabase
            .from('vendor_service_type_commissions')
            .delete()
            .eq('vendor_id', savedVendorId);
          
          // Insert new commissions
          const commissionsToInsert = serviceTypeCommissions.map(c => ({
            vendor_id: savedVendorId,
            service_type_id: c.service_type_id,
            commission_rate: c.commission_rate
          }));
          
          const { error: commissionsError } = await supabase
            .from('vendor_service_type_commissions')
            .insert(commissionsToInsert);
          
          if (commissionsError) throw commissionsError;
        }
      }
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Error",
        description: `Failed to save vendor: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteVendor = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
        variant: "default"
      });
      
      navigate('/vendors');
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: `Failed to delete vendor: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
    }
  };

  return {
    saving,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleSaveVendor,
    handleDeleteVendor
  };
};
