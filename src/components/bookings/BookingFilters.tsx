
import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { BookingStatus, CommissionStatus } from "@/types";

// Export the interface separately from the component
export interface BookingFiltersType {
  clientSearchTerm: string;
  serviceTypes: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  bookingStatuses: BookingStatus[];
  commissionStatuses: CommissionStatus[];
}

const defaultFilters: BookingFiltersType = {
  clientSearchTerm: "",
  serviceTypes: [],
  dateRange: {
    from: undefined,
    to: undefined,
  },
  bookingStatuses: [],
  commissionStatuses: []
};

interface BookingFiltersProps {
  onFilterChange: (filters: BookingFiltersType) => void;
  serviceTypes: { id: string; name: string }[];
}

const BookingFilters = ({ onFilterChange, serviceTypes }: BookingFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<BookingFiltersType>(defaultFilters);
  
  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.clientSearchTerm.trim()) count++;
    if (filters.serviceTypes.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.bookingStatuses.length > 0) count++;
    if (filters.commissionStatuses.length > 0) count++;
    return count;
  };
  
  const handleFilterChange = (newFilters: Partial<BookingFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
  };
  
  const applyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };
  
  const clearFilters = () => {
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
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
      <PopoverContent className="w-80 md:w-96 p-4" align="start" side="bottom">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Filter Bookings</h3>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        </div>
        
        <div className="space-y-5">
          {/* Client search filter */}
          <div>
            <Label className="mb-2 block">Client Name</Label>
            <Input
              placeholder="Search by client name"
              value={filters.clientSearchTerm}
              onChange={(e) => handleFilterChange({ clientSearchTerm: e.target.value })}
            />
          </div>
          
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
              <DropdownMenuContent className="w-full">
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
          
          {/* Date Range Filter */}
          <div>
            <Label className="mb-2 block">Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    {filters.dateRange.from ? (
                      format(filters.dateRange.from, "MMM dd, yyyy")
                    ) : (
                      <span className="text-muted-foreground">From date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.from}
                    onSelect={(date) => 
                      handleFilterChange({ dateRange: { ...filters.dateRange, from: date } })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    {filters.dateRange.to ? (
                      format(filters.dateRange.to, "MMM dd, yyyy")
                    ) : (
                      <span className="text-muted-foreground">To date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.to}
                    onSelect={(date) => 
                      handleFilterChange({ dateRange: { ...filters.dateRange, to: date } })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Booking Status Filter */}
          <div>
            <Label className="mb-2 block">Booking Status</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filters.bookingStatuses.length > 0 
                    ? `${filters.bookingStatuses.length} selected` 
                    : "Select booking status"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuLabel>Booking Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.values(BookingStatus).map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={filters.bookingStatuses.includes(status)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange({
                          bookingStatuses: [...filters.bookingStatuses, status]
                        });
                      } else {
                        handleFilterChange({
                          bookingStatuses: filters.bookingStatuses.filter(s => s !== status)
                        });
                      }
                    }}
                  >
                    {status}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Commission Status Filter */}
          <div>
            <Label className="mb-2 block">Commission Status</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filters.commissionStatuses.length > 0 
                    ? `${filters.commissionStatuses.length} selected` 
                    : "Select commission status"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuLabel>Commission Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.values(CommissionStatus).map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={filters.commissionStatuses.includes(status)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange({
                          commissionStatuses: [...filters.commissionStatuses, status]
                        });
                      } else {
                        handleFilterChange({
                          commissionStatuses: filters.commissionStatuses.filter(s => s !== status)
                        });
                      }
                    }}
                  >
                    {status}
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

export default BookingFilters;
