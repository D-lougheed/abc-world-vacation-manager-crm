
import React from 'react';
import { LocationTag } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LocationTagSelectProps {
  locationTags: LocationTag[];
  selectedLocationTag: LocationTag | null;
  onLocationTagChange: (locationTag: LocationTag | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const LocationTagSelect: React.FC<LocationTagSelectProps> = ({
  locationTags,
  selectedLocationTag,
  onLocationTagChange,
  placeholder = "Select a location...",
  disabled = false
}) => {
  const formatLocationTag = (locationTag: LocationTag): string => {
    const parts = [locationTag.continent, locationTag.country];
    if (locationTag.state_province) {
      parts.push(locationTag.state_province);
    }
    if (locationTag.city) {
      parts.push(locationTag.city);
    }
    return parts.join(', ');
  };

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onLocationTagChange(null);
    } else {
      const locationTag = locationTags.find(lt => lt.id === value);
      onLocationTagChange(locationTag || null);
    }
  };

  return (
    <Select
      value={selectedLocationTag?.id || "none"}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No location selected</SelectItem>
        {locationTags.map((locationTag) => (
          <SelectItem key={locationTag.id} value={locationTag.id}>
            {formatLocationTag(locationTag)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LocationTagSelect;
