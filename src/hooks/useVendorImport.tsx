
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface VendorData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  serviceArea: string;
  priceRange: string;
  commissionRate: string;
  serviceTypes?: string;
  tags?: string;
  notes?: string;
}

interface ImportResult {
  success: number;
  errors: any[];
}

export const useVendorImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const validateAndCleanData = async (data: VendorData[]): Promise<{ validData: any[], errors: any[] }> => {
    const errors: any[] = [];
    const validData: any[] = [];

    // First, get all existing service types and tags for validation
    const { data: serviceTypesData, error: serviceTypesError } = await supabase
      .from('service_types')
      .select('id, name');
    
    if (serviceTypesError) {
      throw new Error(`Failed to fetch service types: ${serviceTypesError.message}`);
    }

    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('id, name');
    
    if (tagsError) {
      throw new Error(`Failed to fetch tags: ${tagsError.message}`);
    }

    const serviceTypeMap = new Map(serviceTypesData?.map(st => [st.name.toLowerCase(), st.id]) || []);
    const tagMap = new Map(tagsData?.map(t => [t.name.toLowerCase(), t.id]) || []);

    for (let i = 0; i < data.length; i++) {
      const vendor = data[i];
      const rowErrors: string[] = [];

      // Validate price range
      const priceRange = parseInt(vendor.priceRange);
      if (isNaN(priceRange) || priceRange < 1 || priceRange > 5) {
        rowErrors.push('Price range must be a number between 1 and 5');
      }

      // Validate commission rate
      const commissionRate = parseFloat(vendor.commissionRate);
      if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
        rowErrors.push('Commission rate must be a number between 0 and 1 (e.g., 0.1 for 10%)');
      }

      // Validate service types if provided
      let serviceTypeIds: string[] = [];
      if (vendor.serviceTypes && vendor.serviceTypes.trim()) {
        const serviceTypeNames = vendor.serviceTypes.split(',').map(name => name.trim());
        for (const serviceName of serviceTypeNames) {
          const serviceId = serviceTypeMap.get(serviceName.toLowerCase());
          if (!serviceId) {
            rowErrors.push(`Service type "${serviceName}" does not exist`);
          } else {
            serviceTypeIds.push(serviceId);
          }
        }
      }

      // Validate tags if provided
      let tagIds: string[] = [];
      if (vendor.tags && vendor.tags.trim()) {
        const tagNames = vendor.tags.split(',').map(name => name.trim());
        for (const tagName of tagNames) {
          const tagId = tagMap.get(tagName.toLowerCase());
          if (!tagId) {
            rowErrors.push(`Tag "${tagName}" does not exist`);
          } else {
            tagIds.push(tagId);
          }
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: i + 2, // +2 for header and 0-based index
          data: vendor,
          errors: rowErrors
        });
      } else {
        validData.push({
          name: vendor.name.trim(),
          contact_person: vendor.contactPerson.trim(),
          email: vendor.email.trim(),
          phone: vendor.phone.trim(),
          address: vendor.address.trim(),
          service_area: vendor.serviceArea.trim(),
          price_range: priceRange,
          notes: vendor.notes?.trim() || null,
          serviceTypeIds,
          tagIds,
          commissionRate
        });
      }
    }

    return { validData, errors };
  };

  const importVendors = async (data: VendorData[]): Promise<ImportResult> => {
    setIsImporting(true);
    const errors: any[] = [];
    let successCount = 0;

    try {
      // Validate and clean the data first
      const { validData, errors: validationErrors } = await validateAndCleanData(data);
      
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
      }

      if (validData.length === 0) {
        toast({
          title: "Import failed",
          description: "No valid vendor data found",
          variant: "destructive"
        });
        return { success: 0, errors };
      }

      // Process in batches to avoid overwhelming the database
      const batchSize = 20;
      const batches = [];
      
      for (let i = 0; i < validData.length; i += batchSize) {
        batches.push(validData.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        for (const vendorData of batch) {
          try {
            // Extract service types and tags before inserting vendor
            const { serviceTypeIds, tagIds, commissionRate, ...vendorRecord } = vendorData;

            // Insert vendor
            const { data: insertedVendor, error: vendorError } = await supabase
              .from('vendors')
              .insert([vendorRecord])
              .select()
              .single();

            if (vendorError) {
              if (vendorError.code === '23505') { // Unique constraint violation
                errors.push({
                  data: vendorRecord,
                  message: `Vendor with email ${vendorRecord.email} already exists`
                });
              } else {
                throw vendorError;
              }
              continue;
            }

            // Insert service type relations
            if (serviceTypeIds.length > 0) {
              const serviceTypeRelations = serviceTypeIds.map(serviceTypeId => ({
                vendor_id: insertedVendor.id,
                service_type_id: serviceTypeId
              }));

              const { error: serviceTypesError } = await supabase
                .from('vendor_service_types')
                .insert(serviceTypeRelations);

              if (serviceTypesError) {
                console.error('Error inserting service types for vendor:', serviceTypesError);
              }

              // Insert commission rates for service types
              const commissions = serviceTypeIds.map(serviceTypeId => ({
                vendor_id: insertedVendor.id,
                service_type_id: serviceTypeId,
                commission_rate: commissionRate
              }));

              const { error: commissionsError } = await supabase
                .from('vendor_service_type_commissions')
                .insert(commissions);

              if (commissionsError) {
                console.error('Error inserting commissions for vendor:', commissionsError);
              }
            }

            // Insert tag relations
            if (tagIds.length > 0) {
              const tagRelations = tagIds.map(tagId => ({
                vendor_id: insertedVendor.id,
                tag_id: tagId
              }));

              const { error: tagsError } = await supabase
                .from('vendor_tags')
                .insert(tagRelations);

              if (tagsError) {
                console.error('Error inserting tags for vendor:', tagsError);
              }
            }

            successCount++;

          } catch (error: any) {
            errors.push({
              data: vendorData,
              message: error.message
            });
          }
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} vendors with ${errors.length} errors`
      });

    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
      
      // Add all remaining items as errors
      data.forEach(item => {
        errors.push({
          data: item,
          message: error.message
        });
      });
    } finally {
      setIsImporting(false);
    }

    return {
      success: successCount,
      errors
    };
  };

  return {
    importVendors,
    isImporting
  };
};
