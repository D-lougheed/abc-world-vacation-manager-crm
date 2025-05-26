import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";

interface EditableTag {
  id: string;
  name: string;
  originalName: string; // To track changes
}

const BatchEditTagsPage = () => {
  const [tags, setTags] = useState<EditableTag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchTags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .order("name");

      if (error) throw error;

      setTags(data.map(tag => ({ ...tag, originalName: tag.name })));
    } catch (error: any) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Failed to load tags",
        description: error.message || "Could not load tags for editing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleTagNameChange = (id: string, newName: string) => {
    setTags(prevTags =>
      prevTags.map(tag => (tag.id === id ? { ...tag, name: newName } : tag))
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const changedTags = tags.filter(tag => tag.name !== tag.originalName && tag.name.trim() !== "");
    
    if (changedTags.length === 0) {
      toast({
        title: "No changes to save",
        description: "You haven't modified any tag names.",
      });
      setSaving(false);
      return;
    }

    // Check for duplicate names among the changed tags or existing unchanged tags
    const allTagNames = tags.map(t => t.name.trim().toLowerCase());
    const uniqueTagNames = new Set(allTagNames);
    if (allTagNames.length !== uniqueTagNames.size) {
        toast({
            title: "Duplicate tag names",
            description: "Please ensure all tag names are unique before saving.",
            variant: "destructive",
        });
        setSaving(false);
        return;
    }


    try {
      const updates = changedTags.map(tag =>
        supabase
          .from("tags")
          .update({ name: tag.name.trim() })
          .eq("id", tag.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        throw new Error(errors.map(err => err.error?.message).join(", "));
      }

      toast({
        title: "Tags updated successfully",
        description: `${changedTags.length} tag(s) have been updated.`,
      });
      fetchTags(); // Re-fetch to update originalName and reflect changes
      navigate("/admin/tags"); // Navigate back to the main tags page
    } catch (error: any) {
      console.error("Error saving tags:", error);
      toast({
        title: "Failed to save tags",
        description: error.message || "Some tags could not be updated.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Batch Edit Tags</h1>
          <Button variant="outline" onClick={() => navigate("/admin/tags")}>
            <ArrowLeft className="mr-2" />
            Back to Tags
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Tags</CardTitle>
            <CardDescription>Modify tag names below. Click "Save All Changes" to apply.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveAll} disabled={saving || loading}>
                <Save className="mr-2" />
                {saving ? "Saving..." : "Save All Changes"}
              </Button>
            </div>

            {loading ? (
              <p className="text-center py-8">Loading tags...</p>
            ) : filteredTags.length > 0 ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {filteredTags.map(tag => (
                  <div key={tag.id} className="flex items-center gap-2 p-2 border rounded-md">
                    <Input
                      value={tag.name}
                      onChange={(e) => handleTagNameChange(tag.id, e.target.value)}
                      className="flex-grow"
                      disabled={saving}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No tags found.
              </p>
            )}
             {filteredTags.length > 0 && !loading && (
                <div className="mt-4 text-sm text-muted-foreground">
                    Showing {filteredTags.length} of {tags.length} tags.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default BatchEditTagsPage;
