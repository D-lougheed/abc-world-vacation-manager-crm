
import { useState } from "react";
import { Check, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { RangeSlider } from "@/components/ui/range-slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ServiceType {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface FiltersProps {
  serviceTypes: ServiceType[];
  tags: Tag[];
  onFilterChange: (filters: VendorFilters) => void;
  activeFilters: VendorFilters;
}

export interface VendorFilters {
  serviceTypes: string[];
  priceRange: [number, number];
  commissionRange: [number, number];
  ratingMinimum: number;
  tags: string[];
}

const VendorFilters = ({ 
  serviceTypes, 
  tags, 
  onFilterChange, 
  activeFilters 
}: FiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<VendorFilters>(activeFilters);
  
  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.serviceTypes.length > 0) count++;
    if (filters.priceRange[0] > 1 || filters.priceRange[1] < 5) count++;
    if (filters.commissionRange[0] > 0 || filters.commissionRange[1] < 100) count++;
    if (filters.ratingMinimum > 0) count++;
    if (filters.tags.length > 0) count++;
    return count;
  };
  
  const handleFilterChange = (newFilters: Partial<VendorFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
  };
  
  const applyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };
  
  const clearFilters = () => {
    const resetFilters: VendorFilters = {
      serviceTypes: [],
      priceRange: [1, 5],
      commissionRange: [0, 100],
      ratingMinimum: 0,
      tags: []
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFilterCount = countActiveFilters();
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-primary text-primary-foreground">{activeFilterCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Filter Vendors</h3>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        </div>
        
        <div className="space-y-5">
          {/* Service Types Filter */}
          <div>
            <Label className="mb-2 block">Service Type</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filters.serviceTypes.length > 0 
                    ? `${filters.serviceTypes.length} selected` 
                    : "Select service types"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full max-h-56 overflow-auto">
                <DropdownMenuLabel>Service Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {serviceTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type.id}
                    checked={filters.serviceTypes.includes(type.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange({
                          serviceTypes: [...filters.serviceTypes, type.name]
                        });
                      } else {
                        handleFilterChange({
                          serviceTypes: filters.serviceTypes.filter(t => t !== type.name)
                        });
                      }
                    }}
                  >
                    {type.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Price Range Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Price Range</Label>
              <span className="text-xs text-muted-foreground">
                {Array(filters.priceRange[0]).fill("$").join("")} - {Array(filters.priceRange[1]).fill("$").join("")}
              </span>
            </div>
            <RangeSlider
              defaultValue={[1, 5]}
              value={filters.priceRange}
              min={1} 
              max={5} 
              step={1}
              onValueChange={(value) => {
                // Ensure we always have exactly two values
                const typedValue: [number, number] = value.length === 2 
                  ? [value[0], value[1]] 
                  : [value[0], value[0]];
                handleFilterChange({ priceRange: typedValue });
              }}
              className="py-4"
            />
          </div>
          
          {/* Commission Range Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Commission %</Label>
              <span className="text-xs text-muted-foreground">{filters.commissionRange[0]}% - {filters.commissionRange[1]}%</span>
            </div>
            <RangeSlider
              defaultValue={[0, 100]} 
              value={filters.commissionRange}
              min={0} 
              max={100} 
              step={5}
              onValueChange={(value) => {
                // Ensure we always have exactly two values
                const typedValue: [number, number] = value.length === 2 
                  ? [value[0], value[1]] 
                  : [value[0], value[0]];
                handleFilterChange({ commissionRange: typedValue });
              }}
              className="py-4"
            />
          </div>
          
          {/* Rating Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Minimum Rating</Label>
              <span className="text-xs text-muted-foreground">{filters.ratingMinimum} stars+</span>
            </div>
            <Slider 
              defaultValue={[0]} 
              value={[filters.ratingMinimum]}
              min={0} 
              max={5} 
              step={0.5}
              onValueChange={(value) => handleFilterChange({ ratingMinimum: value[0] })}
              className="py-4"
            />
          </div>
          
          {/* Tags Filter */}
          <div>
            <Label className="mb-2 block">Tags</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filters.tags.length > 0 
                    ? `${filters.tags.length} selected` 
                    : "Select tags"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full max-h-56 overflow-auto">
                <DropdownMenuLabel>Tags</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag.id}
                    checked={filters.tags.includes(tag.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange({
                          tags: [...filters.tags, tag.name]
                        });
                      } else {
                        handleFilterChange({
                          tags: filters.tags.filter(t => t !== tag.name)
                        });
                      }
                    }}
                  >
                    {tag.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex justify-end mt-5 gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VendorFilters;
