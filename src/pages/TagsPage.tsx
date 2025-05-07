import { useState, useEffect } from "react";
import { 
  Search, 
  Tags,
  Tag,
  Trash2,
  Edit,
  Plus,
  Merge
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
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Tag {
  id: string;
  name: string;
  usageCount: number;
}

const TagsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergeLoading, setMergeLoading] = useState(false);
  const { toast } = useToast();

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
        
        // Total usage count
        const usageCount = (serviceTypeTagsCount || 0) + (vendorTagsCount || 0);
        
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

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Tag Management</h1>
          <Button>
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
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                        disabled={mergeLoading}
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
                <Button variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Unused Tags
                </Button>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Batch Edit Tags
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default TagsPage;
