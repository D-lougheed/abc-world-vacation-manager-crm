import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addAuditLog } from "@/services/AuditLogService";

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
  const { user: currentUser } = useAuth();

  const handleSaveVendor = async () => {
    // Define submittedDataForAudit to make it accessible in the catch block
    const submittedDataForAudit = {
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      // Add other relevant fields from formData as needed
    };

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
        
        // Create service type relationships for new vendor
        if (serviceTypes.length > 0 && finalVendorId) {
          await handleServiceTypes(finalVendorId, serviceTypes);
        }
        
        // Create tag relationships for new vendor
        if (tags.length > 0 && finalVendorId) {
          await handleTags(finalVendorId, tags);
        }
        
        toast({
          title: "Vendor created",
          description: `${formData.name} has been added to your vendors`,
        });

        if (currentUser && finalVendorId) {
          await addAuditLog(currentUser, {
            action: 'CREATE_VENDOR',
            resourceType: 'Vendor',
            resourceId: finalVendorId,
            details: { vendorData: submittedDataForAudit },
          });
        }
        
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
        
        // For existing vendors, handle service types and tags
        if (finalVendorId) {
          await handleServiceTypes(finalVendorId, serviceTypes);
          await handleTags(finalVendorId, tags);
        }
        
        toast({
          title: "Vendor updated",
          description: "Vendor information has been successfully updated",
        });

        if (currentUser && vendorId) {
          // For updates, "oldValues" are not readily available in this hook.
          // We log the new values. For more detailed old/new comparison,
          // the component using this hook would need to fetch and pass old data.
          await addAuditLog(currentUser, {
            action: 'UPDATE_VENDOR',
            resourceType: 'Vendor',
            resourceId: vendorId,
            details: { newValues: submittedDataForAudit },
          });
        }
      }
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Failed to save vendor",
        description: error.message,
        variant: "destructive"
      });
      if (currentUser) {
        await addAuditLog(currentUser, {
          action: isNewVendor ? 'CREATE_VENDOR_FAILED' : 'UPDATE_VENDOR_FAILED',
          resourceType: 'Vendor',
          resourceId: vendorId || null, // vendorId might be undefined for new vendor creation failure before ID generation
          details: { error: error.message, submittedData: submittedDataForAudit },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Helper function to handle service types
  const handleServiceTypes = async (vendorId: string, serviceTypes: ServiceType[]) => {
    try {
      // First delete existing service type relationships
      const { error: deleteError } = await supabase
        .from('vendor_service_types')
        .delete()
        .eq('vendor_id', vendorId);
        
      if (deleteError) {
        console.error('Error deleting existing service types:', deleteError);
        toast({
          title: "Warning",
          description: `Error removing old service types: ${deleteError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      // Then insert new service type relationships if any exist
      if (serviceTypes.length > 0) {
        const serviceTypeRelations = serviceTypes.map(st => ({
          vendor_id: vendorId,
          service_type_id: st.id
        }));
        
        const { error: insertError } = await supabase
          .from('vendor_service_types')
          .insert(serviceTypeRelations);
        
        if (insertError) {
          console.error('Error adding service types:', insertError);
          toast({
            title: "Warning",
            description: `Error adding service types: ${insertError.message}`,
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error('Error managing vendor service types:', error);
    }
  };

  // Helper function to handle tags
  const handleTags = async (vendorId: string, tags: Tag[]) => {
    try {
      // First delete all existing tag relationships
      const { error: deleteError } = await supabase
        .from('vendor_tags')
        .delete()
        .eq('vendor_id', vendorId);
        
      if (deleteError) {
        console.error('Error deleting existing tags:', deleteError);
        toast({
          title: "Warning",
          description: `Error removing old tags: ${deleteError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      // Then insert new tag relationships if any exist
      if (tags.length > 0) {
        const tagRelations = tags.map(tag => ({
          vendor_id: vendorId,
          tag_id: tag.id
        }));
        
        const { error: insertError } = await supabase
          .from('vendor_tags')
          .insert(tagRelations);
        
        if (insertError) {
          console.error('Error adding tags:', insertError);
          toast({
            title: "Warning",
            description: `Error adding tags: ${insertError.message}`,
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error('Error managing vendor tags:', error);
    }
  };

  const handleDeleteVendor = async () => {
    // Attempt to get vendor name for audit log before deletion, if possible.
    // This might require an extra fetch if formData isn't guaranteed to be the current vendor's data.
    // For simplicity, we'll use formData.name if available, otherwise just the ID.
    const vendorNameToLog = formData?.name || `ID: ${vendorId}`;

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

      if (currentUser && vendorId) {
        await addAuditLog(currentUser, {
          action: 'DELETE_VENDOR',
          resourceType: 'Vendor',
          resourceId: vendorId,
          details: { vendorName: vendorNameToLog }, // Log name if available
        });
      }
      
      navigate('/vendors');
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Failed to delete vendor",
        description: error.message,
        variant: "destructive"
      });
      if (currentUser && vendorId) {
        await addAuditLog(currentUser, {
          action: 'DELETE_VENDOR_FAILED',
          resourceType: 'Vendor',
          resourceId: vendorId,
          details: { error: error.message, vendorName: vendorNameToLog },
        });
      }
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
