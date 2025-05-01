
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

export const useVendorActions = (
  vendorId: string | undefined,
  isNewVendor: boolean,
  formData: VendorFormData,
  serviceTypes: ServiceType[],
  tags: Tag[]
) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      
      let finalVendorId = vendorId;
      
      if (isNewVendor) {
        // Insert new vendor
        const { data: newVendor, error: insertError } = await supabase
          .from('vendors')
          .insert(vendorData)
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        finalVendorId = newVendor.id;
        
        // Save service types for this new vendor
        if (serviceTypes.length > 0 && finalVendorId) {
          const serviceTypeRelations = serviceTypes.map(st => ({
            vendor_id: finalVendorId,
            service_type_id: st.id
          }));
          
          const { error: insertServiceTypeError } = await supabase
            .from('vendor_service_types')
            .insert(serviceTypeRelations);
          
          if (insertServiceTypeError) {
            console.error('Error adding service types:', insertServiceTypeError);
            toast({
              title: "Warning",
              description: `Error adding service types: ${insertServiceTypeError.message}`,
              variant: "destructive"
            });
          }
        }
        
        // Save tags for this new vendor
        if (tags.length > 0 && finalVendorId) {
          const tagRelations = tags.map(tag => ({
            vendor_id: finalVendorId,
            tag_id: tag.id
          }));
          
          const { error: insertTagError } = await supabase
            .from('vendor_tags')
            .insert(tagRelations);
          
          if (insertTagError) {
            console.error('Error adding tags:', insertTagError);
            toast({
              title: "Warning",
              description: `Error adding tags: ${insertTagError.message}`,
              variant: "destructive"
            });
          }
        }
        
        toast({
          title: "Vendor created",
          description: `${formData.name} has been added to your vendors`,
        });
        
        // Navigate to the new vendor's page in view mode
        navigate(`/vendors/${finalVendorId}`);
        return;
      } else {
        // Update existing vendor
        const { error: updateError } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', vendorId);
        
        if (updateError) throw updateError;
        
        // For existing vendors, handle service types
        if (finalVendorId) {
          // First delete existing relationships
          const { error: deleteSTError } = await supabase
            .from('vendor_service_types')
            .delete()
            .eq('vendor_id', finalVendorId);
          
          if (deleteSTError) {
            console.error('Error deleting vendor service types:', deleteSTError);
            toast({
              title: "Warning",
              description: `Error removing existing service types: ${deleteSTError.message}`,
              variant: "destructive"
            });
          }
          
          // Only insert if there are service types to add
          if (serviceTypes.length > 0) {
            // Then insert new service type relationships
            const serviceTypeRelations = serviceTypes.map(st => ({
              vendor_id: finalVendorId,
              service_type_id: st.id
            }));
            
            const { error: insertSTError } = await supabase
              .from('vendor_service_types')
              .insert(serviceTypeRelations);
            
            if (insertSTError) {
              console.error('Error adding service types:', insertSTError);
              toast({
                title: "Warning",
                description: `Error adding service types: ${insertSTError.message}`,
                variant: "destructive"
              });
            }
          }
          
          // For existing vendors, handle tags
          // First delete existing relationships
          const { error: deleteTagError } = await supabase
            .from('vendor_tags')
            .delete()
            .eq('vendor_id', finalVendorId);
          
          if (deleteTagError) {
            console.error('Error deleting vendor tags:', deleteTagError);
            toast({
              title: "Warning",
              description: `Error removing existing tags: ${deleteTagError.message}`,
              variant: "destructive"
            });
          }
          
          // Only insert if there are tags to add
          if (tags.length > 0) {
            // Then insert new tag relationships
            const tagRelations = tags.map(tag => ({
              vendor_id: finalVendorId,
              tag_id: tag.id
            }));
            
            const { error: insertTagError } = await supabase
              .from('vendor_tags')
              .insert(tagRelations);
            
            if (insertTagError) {
              console.error('Error adding tags:', insertTagError);
              toast({
                title: "Warning",
                description: `Error adding tags: ${insertTagError.message}`,
                variant: "destructive"
              });
            }
          }
        }
        
        toast({
          title: "Vendor updated",
          description: "Vendor information has been successfully updated",
        });
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

  const handleDeleteVendor = async () => {
    try {
      setSaving(true);
      
      // First delete vendor relationships
      await supabase.from('vendor_service_types').delete().eq('vendor_id', vendorId);
      await supabase.from('vendor_tags').delete().eq('vendor_id', vendorId);
      await supabase.from('vendor_files').delete().eq('vendor_id', vendorId);
      
      // Then delete the vendor
      const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
      
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

  return {
    saving,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleSaveVendor,
    handleDeleteVendor
  };
};
