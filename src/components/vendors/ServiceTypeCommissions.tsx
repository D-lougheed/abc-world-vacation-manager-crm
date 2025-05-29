
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Save } from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
}

interface ServiceTypeCommission {
  service_type_id: string;
  commission_rate: number;
}

interface ServiceTypeCommissionsProps {
  vendorId?: string;
  isNewVendor: boolean;
  serviceTypes: ServiceType[];
  onCommissionsChange: (commissions: ServiceTypeCommission[]) => void;
  defaultCommissionRate: number;
}

const ServiceTypeCommissions = ({
  vendorId,
  isNewVendor,
  serviceTypes,
  onCommissionsChange,
  defaultCommissionRate
}: ServiceTypeCommissionsProps) => {
  const [commissions, setCommissions] = useState<ServiceTypeCommission[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isNewVendor && vendorId) {
      fetchExistingCommissions();
    } else {
      // Initialize with default commission rates for new vendors
      const defaultCommissions = serviceTypes.map(st => ({
        service_type_id: st.id,
        commission_rate: defaultCommissionRate
      }));
      setCommissions(defaultCommissions);
      onCommissionsChange(defaultCommissions);
    }
  }, [vendorId, serviceTypes, isNewVendor, defaultCommissionRate]);

  const fetchExistingCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_service_type_commissions')
        .select('*')
        .eq('vendor_id', vendorId);

      if (error) throw error;

      // Create commission entries for all service types, using existing rates where available
      const commissionsMap = new Map(
        data?.map(c => [c.service_type_id, c.commission_rate]) || []
      );

      const allCommissions = serviceTypes.map(st => ({
        service_type_id: st.id,
        commission_rate: commissionsMap.get(st.id) || defaultCommissionRate
      }));

      setCommissions(allCommissions);
      onCommissionsChange(allCommissions);
    } catch (error: any) {
      console.error('Error fetching service type commissions:', error);
      toast({
        title: "Error",
        description: "Failed to load commission rates",
        variant: "destructive"
      });
    }
  };

  const handleCommissionChange = (serviceTypeId: string, rate: string) => {
    const numRate = parseFloat(rate) || 0;
    const updatedCommissions = commissions.map(c =>
      c.service_type_id === serviceTypeId
        ? { ...c, commission_rate: numRate }
        : c
    );
    setCommissions(updatedCommissions);
    onCommissionsChange(updatedCommissions);
  };

  const saveCommissions = async () => {
    if (isNewVendor || !vendorId) {
      toast({
        title: "Info",
        description: "Commission rates will be saved when the vendor is created",
        variant: "default"
      });
      return;
    }

    try {
      setSaving(true);

      // Delete existing commissions for this vendor
      await supabase
        .from('vendor_service_type_commissions')
        .delete()
        .eq('vendor_id', vendorId);

      // Insert new commissions
      const commissionsToInsert = commissions.map(c => ({
        vendor_id: vendorId,
        service_type_id: c.service_type_id,
        commission_rate: c.commission_rate
      }));

      const { error } = await supabase
        .from('vendor_service_type_commissions')
        .insert(commissionsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission rates updated successfully",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error saving commission rates:', error);
      toast({
        title: "Error",
        description: "Failed to save commission rates",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (serviceTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Service Type Commission Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add service types to this vendor to set specific commission rates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Service Type Commission Rates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serviceTypes.map(serviceType => {
          const commission = commissions.find(c => c.service_type_id === serviceType.id);
          return (
            <div key={serviceType.id} className="flex items-center justify-between space-x-4">
              <Label className="font-medium min-w-0 flex-1">
                {serviceType.name}
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={commission?.commission_rate || 0}
                  onChange={(e) => handleCommissionChange(serviceType.id, e.target.value)}
                  className="w-20 text-right"
                  min="0"
                  max="100"
                  step="0.5"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          );
        })}
        
        {!isNewVendor && (
          <div className="pt-4 border-t">
            <Button 
              onClick={saveCommissions} 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Commission Rates
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceTypeCommissions;
