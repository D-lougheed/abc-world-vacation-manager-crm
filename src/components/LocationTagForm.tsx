
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface LocationTagFormProps {
  editingTag?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface LocationData {
  continents: string[];
  countries: { [continent: string]: string[] };
  states: { [country: string]: string[] };
  cities: { [state: string]: string[] };
}

const LocationTagForm = ({ editingTag, onSubmit, onCancel }: LocationTagFormProps) => {
  const [formData, setFormData] = useState({
    continent: editingTag?.continent || '',
    country: editingTag?.country || '',
    state_province: editingTag?.state_province || '',
    city: editingTag?.city || '',
  });

  const [locationData, setLocationData] = useState<LocationData>({
    continents: [],
    countries: {},
    states: {},
    cities: {}
  });

  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchLocationData();
  }, []);

  useEffect(() => {
    if (formData.continent) {
      setAvailableCountries(locationData.countries[formData.continent] || []);
      if (!locationData.countries[formData.continent]?.includes(formData.country)) {
        setFormData(prev => ({ ...prev, country: '', state_province: '', city: '' }));
      }
    } else {
      setAvailableCountries([]);
    }
  }, [formData.continent, locationData.countries]);

  useEffect(() => {
    if (formData.country) {
      setAvailableStates(locationData.states[formData.country] || []);
      if (!locationData.states[formData.country]?.includes(formData.state_province)) {
        setFormData(prev => ({ ...prev, state_province: '', city: '' }));
      }
    } else {
      setAvailableStates([]);
    }
  }, [formData.country, locationData.states]);

  useEffect(() => {
    if (formData.state_province) {
      setAvailableCities(locationData.cities[formData.state_province] || []);
      if (!locationData.cities[formData.state_province]?.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    } else {
      setAvailableCities([]);
    }
  }, [formData.state_province, locationData.cities]);

  const fetchLocationData = async () => {
    try {
      const { data, error } = await supabase
        .from('location_tags')
        .select('continent, country, state_province, city');

      if (error) throw error;

      const locationMap: LocationData = {
        continents: [],
        countries: {},
        states: {},
        cities: {}
      };

      const continentSet = new Set<string>();
      const countryMap: { [continent: string]: Set<string> } = {};
      const stateMap: { [country: string]: Set<string> } = {};
      const cityMap: { [state: string]: Set<string> } = {};

      data?.forEach((tag) => {
        continentSet.add(tag.continent);

        if (!countryMap[tag.continent]) {
          countryMap[tag.continent] = new Set();
        }
        countryMap[tag.continent].add(tag.country);

        if (tag.state_province) {
          if (!stateMap[tag.country]) {
            stateMap[tag.country] = new Set();
          }
          stateMap[tag.country].add(tag.state_province);

          if (tag.city) {
            if (!cityMap[tag.state_province]) {
              cityMap[tag.state_province] = new Set();
            }
            cityMap[tag.state_province].add(tag.city);
          }
        }
      });

      locationMap.continents = Array.from(continentSet).sort();
      Object.entries(countryMap).forEach(([continent, countries]) => {
        locationMap.countries[continent] = Array.from(countries).sort();
      });
      Object.entries(stateMap).forEach(([country, states]) => {
        locationMap.states[country] = Array.from(states).sort();
      });
      Object.entries(cityMap).forEach(([state, cities]) => {
        locationMap.cities[state] = Array.from(cities).sort();
      });

      setLocationData(locationMap);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load location data: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.continent.trim() || !formData.country.trim()) {
      toast({
        title: "Error",
        description: "Continent and Country are required fields",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      continent: formData.continent.trim(),
      country: formData.country.trim(),
      state_province: formData.state_province.trim() || null,
      city: formData.city.trim() || null,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="continent">Continent *</Label>
        <Select 
          value={formData.continent} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, continent: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a continent" />
          </SelectTrigger>
          <SelectContent>
            {locationData.continents.map((continent) => (
              <SelectItem key={continent} value={continent}>
                {continent}
              </SelectItem>
            ))}
            <SelectItem value="custom">+ Add New Continent</SelectItem>
          </SelectContent>
        </Select>
        {formData.continent === 'custom' && (
          <Input
            placeholder="Enter new continent name"
            value={formData.continent === 'custom' ? '' : formData.continent}
            onChange={(e) => setFormData(prev => ({ ...prev, continent: e.target.value }))}
          />
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="country">Country *</Label>
        <Select 
          value={formData.country} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
          disabled={!formData.continent}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {availableCountries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
            <SelectItem value="custom">+ Add New Country</SelectItem>
          </SelectContent>
        </Select>
        {formData.country === 'custom' && (
          <Input
            placeholder="Enter new country name"
            value={formData.country === 'custom' ? '' : formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
          />
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="state_province">State/Province</Label>
        <Select 
          value={formData.state_province} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, state_province: value }))}
          disabled={!formData.country}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a state/province" />
          </SelectTrigger>
          <SelectContent>
            {availableStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
            <SelectItem value="custom">+ Add New State/Province</SelectItem>
          </SelectContent>
        </Select>
        {formData.state_province === 'custom' && (
          <Input
            placeholder="Enter new state/province name"
            value={formData.state_province === 'custom' ? '' : formData.state_province}
            onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
          />
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Select 
          value={formData.city} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
          disabled={!formData.state_province}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a city" />
          </SelectTrigger>
          <SelectContent>
            {availableCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
            <SelectItem value="custom">+ Add New City</SelectItem>
          </SelectContent>
        </Select>
        {formData.city === 'custom' && (
          <Input
            placeholder="Enter new city name"
            value={formData.city === 'custom' ? '' : formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
          />
        )}
      </div>
      
      <div className="flex space-x-2">
        <Button type="submit">
          {editingTag ? "Update" : "Create"} Location Tag
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default LocationTagForm;
