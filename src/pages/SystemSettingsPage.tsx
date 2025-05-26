
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";

const DEFAULT_VENDOR_COMMISSION_KEY = "default_vendor_commission_percentage"; // Renamed key

const SystemSettingsPage = () => {
  const [defaultCommission, setDefaultCommission] = useState("");
  const [initialCommission, setInitialCommission] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", DEFAULT_VENDOR_COMMISSION_KEY) // Use updated key
        .maybeSingle();

      if (error) throw error;

      if (data && data.value) {
        setDefaultCommission(data.value);
        setInitialCommission(data.value);
      } else {
        // If not found, maybe set a placeholder or leave empty for user to input
        setDefaultCommission("10"); // Default to 10% if not set
        setInitialCommission("10");
      }
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
      toast({
        title: "Failed to load settings",
        description: error.message || "Could not load system settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    const commissionValue = parseFloat(defaultCommission);
    if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100) {
      toast({
        title: "Invalid Commission Percentage",
        description: "Please enter a number between 0 and 100.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ key: DEFAULT_VENDOR_COMMISSION_KEY, value: defaultCommission }, { onConflict: 'key' }); // Use updated key

      if (error) throw error;

      toast({
        title: "Settings saved successfully",
        description: "Default vendor commission percentage has been updated.",
      });
      setInitialCommission(defaultCommission); // Update initial value to prevent "unsaved changes"
    } catch (error: any) {
      console.error("Error saving system settings:", error);
      toast({
        title: "Failed to save settings",
        description: error.message || "Could not update system settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = defaultCommission !== initialCommission;

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">System Settings</h1>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Panel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Default Vendor Commission</CardTitle> {/* Updated Title */}
            <CardDescription>Set the default commission percentage for new vendors.</CardDescription> {/* Updated Description */}
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p>Loading settings...</p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="defaultVendorCommission">Default Vendor Commission Percentage (%)</Label> {/* Updated Label */}
                <Input
                  id="defaultVendorCommission" // Updated id
                  type="number"
                  value={defaultCommission}
                  onChange={(e) => setDefaultCommission(e.target.value)}
                  placeholder="e.g., 10"
                  className="max-w-xs"
                  disabled={saving}
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={saving || loading || !hasUnsavedChanges}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
            {hasUnsavedChanges && !saving && (
                <p className="text-sm text-yellow-600 text-right">You have unsaved changes.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Future settings can be added here as new cards */}

      </div>
    </RoleBasedComponent>
  );
};

export default SystemSettingsPage;
