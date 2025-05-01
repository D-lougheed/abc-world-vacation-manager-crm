
import { useState } from "react";
import { 
  Search, 
  Tags,
  Tag,
  Trash2,
  Edit,
  Plus,
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

const TagsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Dummy data
  const tags = [
    { id: "1", name: "Luxury", usageCount: 24 },
    { id: "2", name: "Budget", usageCount: 17 },
    { id: "3", name: "Family-Friendly", usageCount: 19 },
    { id: "4", name: "Business", usageCount: 12 },
    { id: "5", name: "Adventure", usageCount: 15 },
    { id: "6", name: "Cultural", usageCount: 9 },
    { id: "7", name: "Beach", usageCount: 22 },
    { id: "8", name: "Mountain", usageCount: 11 },
    { id: "9", name: "City", usageCount: 14 },
    { id: "10", name: "All-Inclusive", usageCount: 20 },
    { id: "11", name: "Spa", usageCount: 8 },
    { id: "12", name: "Golf", usageCount: 6 },
    { id: "13", name: "Ski", usageCount: 7 },
    { id: "14", name: "Cruise", usageCount: 10 },
    { id: "15", name: "Safari", usageCount: 5 }
  ];

  // Filter tags based on search term
  const filteredTags = tags.filter((tag) => {
    return tag.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort tags by usage count in descending order
  const sortedTags = [...filteredTags].sort((a, b) => b.usageCount - a.usageCount);

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
              
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Most Used Tag</p>
                    <p className="text-2xl font-bold">{tags.sort((a, b) => b.usageCount - a.usageCount)[0].name}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs p-2">
                    Used {tags.sort((a, b) => b.usageCount - a.usageCount)[0].usageCount} times
                  </Badge>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                    <p className="text-2xl font-bold">{tags.reduce((sum, tag) => sum + tag.usageCount, 0)}</p>
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
                  {sortedTags.map((tag) => (
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
                  ))}
                  {filteredTags.length === 0 && (
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
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Merge Similar Tags
                </Button>
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
