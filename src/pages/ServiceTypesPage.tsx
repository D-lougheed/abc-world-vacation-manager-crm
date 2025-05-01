
import { useState, useEffect } from "react";
import { 
  Search, 
  Plus,
  Briefcase,
  Tags,
  Trash2,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tag {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface ServiceType {
  id: string;
  name: string;
  tags: Tag[];
  vendorCount: number;
  showVendors?: boolean;
  vendors?: Vendor[];
}

const ServiceTypesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [newServiceTypeName, setNewServiceTypeName] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState("");
  const { toast } = useToast();

  // Fetch service types and tags
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        setLoading(true);
        
        // Fetch all tags for selection
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .order('name');
        
        if (tagsError) throw tagsError;
        setAvailableTags(tagsData);
        
        // Fetch service types
        const { data: serviceTypesData, error: serviceTypesError } = await supabase
          .from('service_types')
          .select('*')
          .order('name');
        
        if (serviceTypesError) throw serviceTypesError;
        
        // For each service type, fetch associated tags and vendor count
        const serviceTypesWithDetails = await Promise.all(serviceTypesData.map(async (serviceType) => {
          // Fetch tags for this service type
          const { data: tagRelations, error: tagRelationsError } = await supabase
            .from('service_type_tags')
            .select('tag_id')
            .eq('service_type_id', serviceType.id);
          
          if (tagRelationsError) throw tagRelationsError;
          
          let tags: Tag[] = [];
          if (tagRelations.length > 0) {
            const tagIds = tagRelations.map(relation => relation.tag_id);
            const { data: tagsData, error: tagsError } = await supabase
              .from('tags')
              .select('*')
              .in('id', tagIds);
            
            if (tagsError) throw tagsError;
            tags = tagsData;
          }
          
          // Count vendors using this service type
          const { count: vendorCount, error: vendorCountError } = await supabase
            .from('vendor_service_types')
            .select('vendor_id', { count: 'exact', head: true })
            .eq('service_type_id', serviceType.id);
          
          if (vendorCountError) throw vendorCountError;
          
          return {
            id: serviceType.id,
            name: serviceType.name,
            tags: tags,
            vendorCount: vendorCount || 0,
            showVendors: false,
            vendors: []
          };
        }));
        
        setServiceTypes(serviceTypesWithDetails);
      } catch (error: any) {
        console.error('Error fetching service types:', error);
        toast({
          title: "Failed to load service types",
          description: error.message || "There was an error loading the service type data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServiceTypes();
  }, [toast]);

  // Filter service types based on search term
  const filteredServiceTypes = serviceTypes.filter((serviceType) => {
    const name = serviceType.name.toLowerCase();
    const tags = serviceType.tags.map(tag => tag.name).join(" ").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || tags.includes(searchTerm.toLowerCase());
  });

  // Toggle vendors visibility and fetch vendors if needed
  const toggleVendors = async (serviceTypeId: string) => {
    const updatedServiceTypes = serviceTypes.map(async (st) => {
      if (st.id === serviceTypeId) {
        const showVendors = !st.showVendors;
        
        // If showing vendors and they haven't been loaded yet, fetch them
        if (showVendors && (!st.vendors || st.vendors.length === 0)) {
          try {
            // Get vendor IDs for this service type
            const { data: vendorRelations, error: vendorRelationsError } = await supabase
              .from('vendor_service_types')
              .select('vendor_id')
              .eq('service_type_id', serviceTypeId);
            
            if (vendorRelationsError) throw vendorRelationsError;
            
            let vendors: Vendor[] = [];
            if (vendorRelations.length > 0) {
              const vendorIds = vendorRelations.map(relation => relation.vendor_id);
              const { data: vendorsData, error: vendorsError } = await supabase
                .from('vendors')
                .select('id, name')
                .in('id', vendorIds);
              
              if (vendorsError) throw vendorsError;
              vendors = vendorsData;
            }
            
            return { ...st, showVendors, vendors };
          } catch (error) {
            console.error('Error fetching vendors:', error);
            toast({
              title: "Failed to load vendors",
              description: "There was an error loading vendor data",
              variant: "destructive"
            });
            return st;
          }
        }
        
        return { ...st, showVendors };
      }
      return st;
    });

    const resolvedServiceTypes = await Promise.all(updatedServiceTypes);
    setServiceTypes(resolvedServiceTypes);
  };

  // Add a new service type
  const handleAddServiceType = async () => {
    if (!newServiceTypeName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a service type name",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert the new service type
      const { data: newServiceType, error: serviceTypeError } = await supabase
        .from('service_types')
        .insert([{ name: newServiceTypeName.trim() }])
        .select()
        .single();
      
      if (serviceTypeError) throw serviceTypeError;
      
      // Insert tag relationships if any are selected
      if (selectedTagIds.length > 0) {
        const tagRelations = selectedTagIds.map(tagId => ({
          service_type_id: newServiceType.id,
          tag_id: tagId
        }));
        
        const { error: tagRelationsError } = await supabase
          .from('service_type_tags')
          .insert(tagRelations);
        
        if (tagRelationsError) throw tagRelationsError;
      }
      
      toast({
        title: "Success",
        description: "Service type added successfully"
      });
      
      // Reset form and refetch data
      setNewServiceTypeName("");
      setSelectedTagIds([]);
      setAddDialogOpen(false);
      
      // Refetch service types to include the new one
      const { data: updatedTypes, error: refetchError } = await supabase
        .from('service_types')
        .select('*')
        .order('name');
      
      if (refetchError) throw refetchError;
      
      // Update the service types with the new data
      const updatedServiceTypes = [...serviceTypes];
      updatedServiceTypes.push({
        id: newServiceType.id,
        name: newServiceType.name,
        tags: selectedTagIds.map(id => availableTags.find(tag => tag.id === id)!).filter(Boolean),
        vendorCount: 0,
        showVendors: false,
        vendors: []
      });
      
      setServiceTypes(updatedServiceTypes);
    } catch (error: any) {
      console.error('Error adding service type:', error);
      toast({
        title: "Failed to add service type",
        description: error.message || "There was an error adding the service type",
        variant: "destructive"
      });
    }
  };

  // Edit an existing service type
  const handleEditServiceType = async () => {
    if (!selectedServiceType || !selectedServiceType.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a service type name",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update the service type
      const { error: updateError } = await supabase
        .from('service_types')
        .update({ name: selectedServiceType.name.trim() })
        .eq('id', selectedServiceType.id);
      
      if (updateError) throw updateError;
      
      // Delete all existing tag relationships
      const { error: deleteTagsError } = await supabase
        .from('service_type_tags')
        .delete()
        .eq('service_type_id', selectedServiceType.id);
      
      if (deleteTagsError) throw deleteTagsError;
      
      // Insert new tag relationships
      if (selectedTagIds.length > 0) {
        const tagRelations = selectedTagIds.map(tagId => ({
          service_type_id: selectedServiceType.id,
          tag_id: tagId
        }));
        
        const { error: tagRelationsError } = await supabase
          .from('service_type_tags')
          .insert(tagRelations);
        
        if (tagRelationsError) throw tagRelationsError;
      }
      
      toast({
        title: "Success",
        description: "Service type updated successfully"
      });
      
      // Reset form and refetch data
      setSelectedServiceType(null);
      setSelectedTagIds([]);
      setEditDialogOpen(false);
      
      // Update the service type in the local state
      const updatedServiceTypes = serviceTypes.map(st => {
        if (st.id === selectedServiceType.id) {
          return {
            ...st,
            name: selectedServiceType.name,
            tags: selectedTagIds.map(id => availableTags.find(tag => tag.id === id)!).filter(Boolean)
          };
        }
        return st;
      });
      
      setServiceTypes(updatedServiceTypes);
    } catch (error: any) {
      console.error('Error updating service type:', error);
      toast({
        title: "Failed to update service type",
        description: error.message || "There was an error updating the service type",
        variant: "destructive"
      });
    }
  };

  // Delete a service type
  const handleDeleteServiceType = async (serviceTypeId: string) => {
    try {
      // Check if service type is used by any vendors
      const { count, error: countError } = await supabase
        .from('vendor_service_types')
        .select('vendor_id', { count: 'exact', head: true })
        .eq('service_type_id', serviceTypeId);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast({
          title: "Cannot Delete",
          description: "This service type is being used by vendors and cannot be deleted",
          variant: "destructive"
        });
        return;
      }
      
      // Delete tag relationships first
      const { error: deleteTagsError } = await supabase
        .from('service_type_tags')
        .delete()
        .eq('service_type_id', serviceTypeId);
      
      if (deleteTagsError) throw deleteTagsError;
      
      // Delete the service type
      const { error: deleteError } = await supabase
        .from('service_types')
        .delete()
        .eq('id', serviceTypeId);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: "Success",
        description: "Service type deleted successfully"
      });
      
      // Update the local state
      setServiceTypes(serviceTypes.filter(st => st.id !== serviceTypeId));
    } catch (error: any) {
      console.error('Error deleting service type:', error);
      toast({
        title: "Failed to delete service type",
        description: error.message || "There was an error deleting the service type",
        variant: "destructive"
      });
    }
  };

  // Add a new tag
  const handleAddTag = async () => {
    if (!currentTagInput.trim()) return;
    
    try {
      // Check if tag already exists
      let { data: existingTags, error: checkError } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', currentTagInput.trim());
      
      if (checkError) throw checkError;
      
      let tagId;
      
      // If tag doesn't exist, create it
      if (!existingTags || existingTags.length === 0) {
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert([{ name: currentTagInput.trim() }])
          .select()
          .single();
        
        if (createError) throw createError;
        
        // Add the new tag to available tags
        setAvailableTags([...availableTags, newTag]);
        tagId = newTag.id;
      } else {
        tagId = existingTags[0].id;
      }
      
      // Add the tag to selected tags if not already selected
      if (!selectedTagIds.includes(tagId)) {
        setSelectedTagIds([...selectedTagIds, tagId]);
      }
      
      setCurrentTagInput("");
    } catch (error: any) {
      console.error('Error adding tag:', error);
      toast({
        title: "Failed to add tag",
        description: error.message || "There was an error adding the tag",
        variant: "destructive"
      });
    }
  };

  // Remove a tag from selection
  const handleRemoveTag = (tagId: string) => {
    setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
  };

  // Open the edit dialog and set up the form
  const openEditDialog = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    setSelectedTagIds(serviceType.tags.map(tag => tag.id));
    setEditDialogOpen(true);
  };

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Service Types</h1>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Service Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Service Type</DialogTitle>
                <DialogDescription>
                  Create a new service type for vendors. Service types help categorize the services that vendors offer.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={newServiceTypeName}
                    onChange={(e) => setNewServiceTypeName(e.target.value)}
                    placeholder="Service type name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">
                    Tags
                  </label>
                  <div className="col-span-3">
                    <div className="flex items-center mb-2">
                      <Input
                        value={currentTagInput}
                        onChange={(e) => setCurrentTagInput(e.target.value)}
                        placeholder="Add a tag"
                        className="mr-2"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTagIds.map((tagId) => {
                        const tag = availableTags.find(t => t.id === tagId);
                        return tag ? (
                          <Badge key={tagId} variant="outline" className="text-xs flex items-center">
                            <Tags className="mr-1 h-3 w-3" />
                            {tag.name}
                            <Button
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => handleRemoveTag(tagId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ) : null;
                      })}
                      {selectedTagIds.length === 0 && (
                        <span className="text-sm text-muted-foreground">No tags selected</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <label className="text-sm font-medium">Select from existing tags:</label>
                      <Select 
                        onValueChange={(value) => {
                          if (!selectedTagIds.includes(value)) {
                            setSelectedTagIds([...selectedTagIds, value]);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTags
                            .filter(tag => !selectedTagIds.includes(tag.id))
                            .map(tag => (
                              <SelectItem key={tag.id} value={tag.id}>
                                {tag.name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="mr-2">
                  Cancel
                </Button>
                <Button type="submit" onClick={handleAddServiceType}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Service Types Management</CardTitle>
            <CardDescription>Configure service types used for vendors and bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search service types..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Associated Tags</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Loading service types...
                      </TableCell>
                    </TableRow>
                  ) : filteredServiceTypes.length > 0 ? (
                    filteredServiceTypes.map((serviceType) => (
                      <>
                        <TableRow key={serviceType.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-primary" />
                              <span>{serviceType.name}</span>
                              {serviceType.vendorCount > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 p-0 h-6"
                                  onClick={() => toggleVendors(serviceType.id)}
                                >
                                  <List className="h-4 w-4 mr-1" />
                                  <span className="text-xs">{serviceType.vendorCount} vendors</span>
                                  {serviceType.showVendors ? (
                                    <ChevronUp className="h-3 w-3 ml-1" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {serviceType.tags.map((tag) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                  <Tags className="mr-1 h-3 w-3" />
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(serviceType)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Edit Service Type</DialogTitle>
                                    <DialogDescription>
                                      Update this service type's details.
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedServiceType && (
                                    <div className="grid gap-4 py-4">
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="edit-name" className="text-right text-sm font-medium">
                                          Name
                                        </label>
                                        <Input
                                          id="edit-name"
                                          className="col-span-3"
                                          value={selectedServiceType.name}
                                          onChange={(e) => setSelectedServiceType({
                                            ...selectedServiceType,
                                            name: e.target.value
                                          })}
                                        />
                                      </div>
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <label className="text-right text-sm font-medium">
                                          Tags
                                        </label>
                                        <div className="col-span-3">
                                          <div className="flex items-center mb-2">
                                            <Input
                                              value={currentTagInput}
                                              onChange={(e) => setCurrentTagInput(e.target.value)}
                                              placeholder="Add a tag"
                                              className="mr-2"
                                              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                            />
                                            <Button type="button" onClick={handleAddTag} variant="outline">Add</Button>
                                          </div>
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {selectedTagIds.map((tagId) => {
                                              const tag = availableTags.find(t => t.id === tagId);
                                              return tag ? (
                                                <Badge key={tagId} variant="outline" className="text-xs flex items-center">
                                                  <Tags className="mr-1 h-3 w-3" />
                                                  {tag.name}
                                                  <Button
                                                    variant="ghost"
                                                    className="h-4 w-4 p-0 ml-1"
                                                    onClick={() => handleRemoveTag(tagId)}
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </Button>
                                                </Badge>
                                              ) : null;
                                            })}
                                            {selectedTagIds.length === 0 && (
                                              <span className="text-sm text-muted-foreground">No tags selected</span>
                                            )}
                                          </div>
                                          <div className="mt-2">
                                            <label className="text-sm font-medium">Select from existing tags:</label>
                                            <Select 
                                              onValueChange={(value) => {
                                                if (!selectedTagIds.includes(value)) {
                                                  setSelectedTagIds([...selectedTagIds, value]);
                                                }
                                              }}
                                            >
                                              <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select a tag" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {availableTags
                                                  .filter(tag => !selectedTagIds.includes(tag.id))
                                                  .map(tag => (
                                                    <SelectItem key={tag.id} value={tag.id}>
                                                      {tag.name}
                                                    </SelectItem>
                                                  ))
                                                }
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="mr-2">
                                      Cancel
                                    </Button>
                                    <Button type="submit" onClick={handleEditServiceType}>
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteServiceType(serviceType.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {serviceType.showVendors && serviceType.vendors && serviceType.vendors.length > 0 && (
                          <TableRow key={`${serviceType.id}-vendors`}>
                            <TableCell colSpan={3} className="bg-muted/30">
                              <div className="p-2">
                                <h4 className="text-sm font-medium mb-2">Vendors using this service type:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {serviceType.vendors.map(vendor => (
                                    <div key={vendor.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                                      <span>{vendor.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No service types found. Try a different search term or add a new service type.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default ServiceTypesPage;
