
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface TagData {
  name: string;
}

interface ImportResult {
  success: number;
  errors: any[];
}

export const useTagImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const importTags = async (data: TagData[]): Promise<ImportResult> => {
    setIsImporting(true);
    const errors: any[] = [];
    let successCount = 0;

    try {
      // Process in batches to avoid overwhelming the database
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < data.length; i += batchSize) {
        batches.push(data.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        // Clean and prepare the data
        const cleanedBatch = batch.map(item => ({
          name: item.name?.trim()
        }));

        try {
          const { data: insertedData, error } = await supabase
            .from('tags')
            .insert(cleanedBatch)
            .select();

          if (error) {
            // Handle duplicate entries gracefully
            if (error.code === '23505') { // Unique constraint violation
              console.log('Some records already exist, continuing...');
              // Try inserting one by one to identify which ones succeed
              for (const item of cleanedBatch) {
                try {
                  const { error: singleError } = await supabase
                    .from('tags')
                    .insert([item]);
                  
                  if (singleError) {
                    errors.push({
                      data: item,
                      message: singleError.message
                    });
                  } else {
                    successCount++;
                  }
                } catch (singleErr: any) {
                  errors.push({
                    data: item,
                    message: singleErr.message
                  });
                }
              }
            } else {
              throw error;
            }
          } else {
            successCount += insertedData?.length || 0;
          }
        } catch (batchError: any) {
          errors.push({
            batch: cleanedBatch,
            message: batchError.message
          });
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} tags with ${errors.length} errors`
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
    importTags,
    isImporting
  };
};
