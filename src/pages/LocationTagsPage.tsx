
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import LocationTagHierarchy from "@/components/LocationTagHierarchy";
import LocationTagForm from "@/components/LocationTagForm";

interface LocationTag {
  id: string;
  continent: string;
  country: string;
  state_province: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

const LocationTagsPage = () => {
  const [locationTags, setLocationTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<LocationTag | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLocationTags();
  }, []);

  const fetchLocationTags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('location_tags')
        .select('*')
        .order('continent', { ascending: true })
        .order('country', { ascending: true })
        .order('state_province', { ascending: true })
        .order('city', { ascending: true });

      if (error) throw error;
      setLocationTags(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load location tags: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingTag) {
        const { error } = await supabase
          .from('location_tags')
          .update(formData)
          .eq('id', editingTag.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Location tag updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('location_tags')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Location tag created successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingTag(null);
      fetchLocationTags();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${editingTag ? 'update' : 'create'} location tag: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (tag: LocationTag) => {
    setEditingTag(tag);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTagId) return;

    try {
      const { error } = await supabase
        .from('location_tags')
        .delete()
        .eq('id', deleteTagId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location tag deleted successfully"
      });
      
      fetchLocationTags();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete location tag: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleteTagId(null);
    }
  };

  const resetForm = () => {
    setEditingTag(null);
  };

  const formatLocationDisplay = (tag: LocationTag) => {
    const parts = [tag.continent, tag.country];
    if (tag.state_province) parts.push(tag.state_province);
    if (tag.city) parts.push(tag.city);
    return parts.join(" > ");
  };

  const filteredLocationTags = locationTags.filter(tag => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tag.continent.toLowerCase().includes(searchLower) ||
      tag.country.toLowerCase().includes(searchLower) ||
      (tag.state_province && tag.state_province.toLowerCase().includes(searchLower)) ||
      (tag.city && tag.city.toLowerCase().includes(searchLower))
    );
  });

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Location Tags</h1>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Location Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? "Edit Location Tag" : "Add Location Tag"}
                </DialogTitle>
                <DialogDescription>
                  Create a hierarchical location tag with continent, country, and optional state/province and city.
                </DialogDescription>
              </DialogHeader>
              
              <LocationTagForm
                editingTag={editingTag}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <Separator />

        <Tabs defaultValue="hierarchy" className="w-full">
          <TabsList>
            <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hierarchy">
            <LocationTagHierarchy />
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search location tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredLocationTags.map((tag) => (
                  <Card key={tag.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{formatLocationDisplay(tag)}</span>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tag)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTagId(tag.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">{tag.continent}</Badge>
                          <Badge variant="outline">{tag.country}</Badge>
                          {tag.state_province && <Badge variant="outline">{tag.state_province}</Badge>}
                          {tag.city && <Badge variant="outline">{tag.city}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(tag.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && filteredLocationTags.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No location tags found matching your search." : "No location tags created yet."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!deleteTagId} onOpenChange={() => setDeleteTagId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Location Tag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this location tag? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleBasedComponent>
  );
};

export default LocationTagsPage;
