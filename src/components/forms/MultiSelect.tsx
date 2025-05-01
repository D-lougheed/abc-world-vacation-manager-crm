
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function MultiSelect({
  options,
  selected = [],
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  loading = false,
  icon,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});

  // Update selected labels whenever options or selected changes
  useEffect(() => {
    const labels: Record<string, string> = {};
    options.forEach((option) => {
      if (selected.includes(option.value)) {
        labels[option.value] = option.label;
      }
    });
    setSelectedLabels(labels);
  }, [options, selected]);

  const handleSelect = (value: string) => {
    if (disabled) return;
    
    const option = options.find((option) => option.value === value);
    if (!option) return;

    const isSelected = selected.includes(value);
    const newSelected = isSelected
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    
    onChange(newSelected);
    
    // Focus the input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemove = (value: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              selected.length > 0 ? "h-auto min-h-10" : "h-10",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && setOpen(!open)}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 items-center">
              {icon && <div className="mr-2">{icon}</div>}
              {selected.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selected.map((value) => (
                    <Badge 
                      key={value} 
                      variant="secondary"
                      className="mr-1 mb-1"
                    >
                      {selectedLabels[value] || value}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={(e) => handleRemove(value, e)}
                      />
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            {loading ? (
              <Loader2 className="h-4 w-4 opacity-50 animate-spin" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-full min-w-[200px]"
          style={{ width: containerRef.current?.offsetWidth }}
          align="start"
        >
          <Command>
            <CommandInput 
              ref={inputRef}
              placeholder="Search..." 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
