import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Tags,
  Tag,
  Trash2,
  Edit,
  Plus,
  Merge,
  Check,
  X
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
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
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface Tag {
  id: string;
  name: string;
  usageCount: number;
}

// Form schema for tag creation
const tagFormSchema = z.object({
  name: z.string()
    .min(1, "Tag name is required")
    .max(50, "Tag name cannot be more than 50 characters")
});

type TagFormValues = z.infer<typeof tagFormSchema>;

const TagsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [removeUnusedLoading, setRemoveUnusedLoading] = useState(false);
  const [openTagDialog, setOpenTagDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize form
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Fetch tags from Supabase
  const fetchTags = async () => {
    try {
      setLoading(true);
      
      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (tagsError) throw tagsError;
      
      // For each tag, count its usage
      const tagsWithUsage = await Promise.all(tagsData.map(async (tag) => {
        // Count service_type_tags usage
        const { count: serviceTypeTagsCount, error: serviceTypeTagsError } = await supabase
          .from('service_type_tags')
          .select('tag_id', { count: 'exact', head: true })
          .eq('tag_id', tag.id);
        
        if (serviceTypeTagsError) throw serviceTypeTagsError;
        
        // Count vendor_tags usage
        const { count: vendorTagsCount, error: vendorTagsError } = await supabase
          .from('vendor_tags')
          .select('tag_id', { count: 'exact', head: true })
          .eq('tag_id', tag.id);
        
        if (vendorTagsError) throw vendorTagsError;

        // Count booking_tags usage
        const { count: bookingTagsCount, error: bookingTagsError } = await supabase
          .from('booking_tags')
          .select('tag_id', { count: 'exact', head: true })
          .eq('tag_id', tag.id);

        if (bookingTagsError) throw bookingTagsError;

        // Count trip_tags usage
        const { count: tripTagsCount, error: tripTagsError } = await supabase
          .from('trip_tags')
          .select('tag_id', { count: 'exact', head: true })
          .eq('tag_id', tag.id);
        
        if (tripTagsError) throw tripTagsError;
        
        // Total usage count
        const usageCount = (serviceTypeTagsCount || 0) + (vendorTagsCount || 0) + (bookingTagsCount || 0) + (tripTagsCount || 0);
        
        return {
          id: tag.id,
          name: tag.name,
          usageCount: usageCount
        };
      }));
      
      setTags(tagsWithUsage);
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      toast({
        title: "Failed to load tags",
        description: error.message || "There was an error loading the tag data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [toast]);

  // Merge similar tags (tags with the same name)
  const handleMergeSimilarTags = async () => {
    try {
      setMergeLoading(true);
      
      // Find tags with the same names
      const tagNames = tags.map(tag => tag.name.toLowerCase().trim());
      const uniqueTagNames = [...new Set(tagNames)];
      
      // If there are no duplicate names, show a message and return
      if (tagNames.length === uniqueTagNames.length) {
        toast({
          title: "No similar tags found",
          description: "There are no tags with the same name to merge.",
          variant: "default"
        });
        setMergeLoading(false);
        return;
      }
      
      // Process each unique name
      let mergedCount = 0;
      for (const name of uniqueTagNames) {
        // Find all tags with this name
        const sameTags = tags.filter(tag => tag.name.toLowerCase().trim() === name)
          .sort((a, b) => a.id.localeCompare(b.id)); // Sort by ID to keep the oldest
        
        // If there's only one tag with this name, continue to the next name
        if (sameTags.length <= 1) continue;
        
        // Keep the oldest tag (first in sorted array) and merge the rest into it
        const oldestTag = sameTags[0];
        const tagsToMerge = sameTags.slice(1);
        
        console.log(`Merging ${tagsToMerge.length} tags into ${oldestTag.name} (ID: ${oldestTag.id})`);
        
        // For each tag to merge, update all references and then delete the tag
        for (const tagToMerge of tagsToMerge) {
          // Update service_type_tags references
          const { error: stError } = await supabase
            .from('service_type_tags')
            .update({ tag_id: oldestTag.id })
            .eq('tag_id', tagToMerge.id);
          
          if (stError) throw stError;
          
          // Update vendor_tags references
          const { error: vtError } = await supabase
            .from('vendor_tags')
            .update({ tag_id: oldestTag.id })
            .eq('tag_id', tagToMerge.id);
          
          if (vtError) throw vtError;
          
          // Update booking_tags references
          const { error: btError } = await supabase
            .from('booking_tags')
            .update({ tag_id: oldestTag.id })
            .eq('tag_id', tagToMerge.id);
          
          if (btError) throw btError;
          
          // Update trip_tags references
          const { error: ttError } = await supabase
            .from('trip_tags')
            .update({ tag_id: oldestTag.id })
            .eq('tag_id', tagToMerge.id);
          
          if (ttError) throw ttError;
          
          // Delete the merged tag
          const { error: deleteError } = await supabase
            .from('tags')
            .delete()
            .eq('id', tagToMerge.id);
          
          if (deleteError) throw deleteError;
          
          mergedCount++;
        }
      }
      
      // Refresh tags after merging
      await fetchTags();
      
      toast({
        title: "Tags merged successfully",
        description: `${mergedCount} duplicate tags have been merged.`,
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('Error merging tags:', error);
      toast({
        title: "Failed to merge tags",
        description: error.message || "There was an error merging the tags",
        variant: "destructive"
      });
    } finally {
      setMergeLoading(false);
    }
  };

  // Handle tag creation
  const onSubmit = async (values: TagFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Check if the tag name already exists (case insensitive)
      const normalizedTagName = values.name.trim().toLowerCase();
      const existingTag = tags.find(tag => 
        tag.name.toLowerCase().trim() === normalizedTagName
      );
      
      if (existingTag) {
        toast({
          title: "Tag already exists",
          description: `A tag with the name "${existingTag.name}" already exists.`,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Insert the new tag
      const { error } = await supabase
        .from('tags')
        .insert({
          name: values.name.trim()
        });
      
      if (error) throw error;
      
      // Refresh tags list
      await fetchTags();
      
      // Reset form and close dialog
      form.reset();
      setOpenTagDialog(false);
      
      toast({
        title: "Tag created successfully",
        description: `The tag "${values.name}" has been created.`,
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast({
        title: "Failed to create tag",
        description: error.message || "There was an error creating the tag",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle removing unused tags
  const handleRemoveUnusedTags = async () => {
    try {
      // Find unused tags (tags with usageCount === 0)
      const unusedTags = tags.filter(tag => tag.usageCount === 0);
      
      // If there are no unused tags, show a message and return
      if (unusedTags.length === 0) {
        toast({
          title: "No unused tags found",
          description: "There are no unused tags to remove.",
          variant: "default"
        });
        return;
      }
      
      // Otherwise, open the confirmation dialog
      setOpenDeleteDialog(true);
    } catch (error: any) {
      console.error('Error checking unused tags:', error);
      toast({
        title: "Failed to check unused tags",
        description: error.message || "There was an error checking for unused tags",
        variant: "destructive"
      });
    }
  };

  // Execute the removal of unused tags
  const executeRemoveUnusedTags = async () => {
    try {
      setRemoveUnusedLoading(true);
      
      // Get unused tags
      const unusedTags = tags.filter(tag => tag.usageCount === 0);
      
      if (unusedTags.length === 0) {
        toast({
          title: "No unused tags found",
          description: "There are no unused tags to remove.",
          variant: "default"
        });
        setOpenDeleteDialog(false);
        setRemoveUnusedLoading(false);
        return;
      }
      
      // Delete each unused tag
      const unusedTagIds = unusedTags.map(tag => tag.id);
      
      const { error } = await supabase
        .from('tags')
        .delete()
        .in('id', unusedTagIds);
      
      if (error) throw error;
      
      // Refresh tags list
      await fetchTags();
      
      toast({
        title: "Unused tags removed",
        description: `${unusedTags.length} unused tags have been removed.`,
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('Error removing unused tags:', error);
      toast({
        title: "Failed to remove unused tags",
        description: error.message || "There was an error removing the unused tags",
        variant: "destructive"
      });
    } finally {
      setRemoveUnusedLoading(false);
      setOpenDeleteDialog(false);
    }
  };

  // Filter tags based on search term
  const filteredTags = tags.filter((tag) => {
    return tag.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort tags by usage count in descending order
  const sortedTags = [...filteredTags].sort((a, b) => b.usageCount - a.usageCount);

  // Find most used tag
  const mostUsedTag = tags.length > 0 ? tags.reduce((prev, current) => 
    (prev.usageCount > current.usageCount) ? prev : current) : null;

  // Calculate total usage
  const totalUsage = tags.reduce((sum, tag) => sum + tag.usageCount, 0);

  // Count unused tags
  const unusedTagsCount = tags.filter(tag => tag.usageCount === 0).length;

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Tag Management</h1>
          <Button onClick={() => setOpenTagDialog(true)}>
            <Tag className="mr-2 h-4 w-4" />
            Add New Tag
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>System Tags</CardTitle>
            <CardDescription>Manage tags used throughout the system</CardDescription>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tags</p>
                    <p className="text-2xl font-bold">{tags.length}</p>
                  </div>
                  <Tags className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
              
              {mostUsedTag && (
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Most Used Tag</p>
                      <p className="text-2xl font-bold">{mostUsedTag.name}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs p-2">
                      Used {mostUsedTag.usageCount} times
                    </Badge>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                    <p className="text-2xl font-bold">{totalUsage}</p>
                  </div>
                  <Tag className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag Name</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Loading tags...
                      </TableCell>
                    </TableRow>
                  ) : sortedTags.length > 0 ? (
                    sortedTags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              <Tag className="mr-1 h-3 w-3" />
                              {tag.name}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{tag.usageCount} uses</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" disabled>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Edit (use Batch Edit for now)</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive" disabled>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete (use Remove Unused for now)</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No tags found. Try a different search term or add a new tag.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Tag Management Tools</h3>
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={handleMergeSimilarTags}
                        disabled={mergeLoading || loading}
                      >
                        <Merge className="mr-2 h-4 w-4" />
                        {mergeLoading ? 'Merging...' : 'Merge Similar Tags'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Merges Tags that have the same name</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={handleRemoveUnusedTags}
                        disabled={removeUnusedLoading || unusedTagsCount === 0 || loading}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {removeUnusedLoading ? 'Removing...' : 'Remove Unused Tags'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Removes tags that aren't used anywhere ({unusedTagsCount} unused)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button variant="outline" onClick={() => navigate("/admin/tags/batch-edit")}>
                  <Edit className="mr-2 h-4 w-4" />
                  Batch Edit Tags
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Tag Dialog */}
      <Dialog open={openTagDialog} onOpenChange={setOpenTagDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Enter a name for the new tag. Tag names must be unique.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tag name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    form.reset();
                    setOpenTagDialog(false);
                  }}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Create Tag
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Unused Tags Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Unused Tags</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all tags that aren't used anywhere in the system. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeUnusedLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeRemoveUnusedTags();
              }}
              disabled={removeUnusedLoading}
            >
              {removeUnusedLoading ? "Removing..." : "Remove Unused Tags"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleBasedComponent>
  );
};

export default TagsPage;
