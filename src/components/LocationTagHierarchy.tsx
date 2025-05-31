
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ChevronRight, Globe, Flag, MapIcon, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface LocationTag {
  id: string;
  continent: string;
  country: string;
  state_province: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

interface HierarchyNode {
  continent: string;
  countries: {
    [country: string]: {
      states: {
        [state: string]: string[];
      };
    };
  };
}

const LocationTagHierarchy = () => {
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAndBuildHierarchy();
  }, []);

  const fetchAndBuildHierarchy = async () => {
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

      const hierarchyMap: { [continent: string]: HierarchyNode } = {};

      data?.forEach((tag: LocationTag) => {
        if (!hierarchyMap[tag.continent]) {
          hierarchyMap[tag.continent] = {
            continent: tag.continent,
            countries: {}
          };
        }

        if (!hierarchyMap[tag.continent].countries[tag.country]) {
          hierarchyMap[tag.continent].countries[tag.country] = {
            states: {}
          };
        }

        const stateName = tag.state_province || 'No State/Province';
        if (!hierarchyMap[tag.continent].countries[tag.country].states[stateName]) {
          hierarchyMap[tag.continent].countries[tag.country].states[stateName] = [];
        }

        if (tag.city) {
          hierarchyMap[tag.continent].countries[tag.country].states[stateName].push(tag.city);
        }
      });

      setHierarchy(Object.values(hierarchyMap));
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load hierarchy: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const populateSampleData = async () => {
    const sampleData = [
      // North America
      { continent: 'North America', country: 'United States', state_province: 'California', city: 'Los Angeles' },
      { continent: 'North America', country: 'United States', state_province: 'California', city: 'San Francisco' },
      { continent: 'North America', country: 'United States', state_province: 'New York', city: 'New York City' },
      { continent: 'North America', country: 'United States', state_province: 'Florida', city: 'Miami' },
      { continent: 'North America', country: 'Canada', state_province: 'Ontario', city: 'Toronto' },
      { continent: 'North America', country: 'Canada', state_province: 'British Columbia', city: 'Vancouver' },
      { continent: 'North America', country: 'Mexico', state_province: 'Quintana Roo', city: 'Cancun' },
      
      // Europe
      { continent: 'Europe', country: 'France', state_province: 'Île-de-France', city: 'Paris' },
      { continent: 'Europe', country: 'France', state_province: 'Provence-Alpes-Côte d\'Azur', city: 'Nice' },
      { continent: 'Europe', country: 'United Kingdom', state_province: 'England', city: 'London' },
      { continent: 'Europe', country: 'United Kingdom', state_province: 'Scotland', city: 'Edinburgh' },
      { continent: 'Europe', country: 'Italy', state_province: 'Lazio', city: 'Rome' },
      { continent: 'Europe', country: 'Italy', state_province: 'Veneto', city: 'Venice' },
      { continent: 'Europe', country: 'Spain', state_province: 'Madrid', city: 'Madrid' },
      { continent: 'Europe', country: 'Germany', state_province: 'Bavaria', city: 'Munich' },
      
      // Asia
      { continent: 'Asia', country: 'Japan', state_province: 'Tokyo', city: 'Tokyo' },
      { continent: 'Asia', country: 'Japan', state_province: 'Kyoto', city: 'Kyoto' },
      { continent: 'Asia', country: 'Thailand', state_province: 'Bangkok', city: 'Bangkok' },
      { continent: 'Asia', country: 'Thailand', state_province: 'Phuket', city: 'Phuket' },
      { continent: 'Asia', country: 'China', state_province: 'Beijing', city: 'Beijing' },
      { continent: 'Asia', country: 'India', state_province: 'Maharashtra', city: 'Mumbai' },
      
      // Australia/Oceania
      { continent: 'Australia/Oceania', country: 'Australia', state_province: 'New South Wales', city: 'Sydney' },
      { continent: 'Australia/Oceania', country: 'Australia', state_province: 'Victoria', city: 'Melbourne' },
      { continent: 'Australia/Oceania', country: 'New Zealand', state_province: 'Auckland', city: 'Auckland' },
      
      // South America
      { continent: 'South America', country: 'Brazil', state_province: 'Rio de Janeiro', city: 'Rio de Janeiro' },
      { continent: 'South America', country: 'Brazil', state_province: 'São Paulo', city: 'São Paulo' },
      { continent: 'South America', country: 'Argentina', state_province: 'Buenos Aires', city: 'Buenos Aires' },
      { continent: 'South America', country: 'Peru', state_province: 'Cusco', city: 'Cusco' },
      
      // Africa
      { continent: 'Africa', country: 'South Africa', state_province: 'Western Cape', city: 'Cape Town' },
      { continent: 'Africa', country: 'Egypt', state_province: 'Cairo Governorate', city: 'Cairo' },
      { continent: 'Africa', country: 'Morocco', state_province: 'Marrakesh-Safi', city: 'Marrakech' },
    ];

    try {
      const { error } = await supabase
        .from('location_tags')
        .insert(sampleData);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${sampleData.length} sample location tags`
      });

      fetchAndBuildHierarchy();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to add sample data: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Location Hierarchy</h3>
        {hierarchy.length === 0 && (
          <Button onClick={populateSampleData} variant="outline">
            <Globe className="mr-2 h-4 w-4" />
            Populate Sample Data
          </Button>
        )}
      </div>

      {hierarchy.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No location tags found. Get started by adding some sample data.</p>
            <Button onClick={populateSampleData}>
              <Globe className="mr-2 h-4 w-4" />
              Add Sample Location Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {hierarchy.map((continent) => (
            <Card key={continent.continent}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-blue-600" />
                  {continent.continent}
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(continent.countries).length} countries
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(continent.countries).map(([countryName, countryData]) => (
                    <div key={countryName} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center mb-2">
                        <Flag className="mr-2 h-4 w-4 text-green-600" />
                        <span className="font-medium">{countryName}</span>
                        <Badge variant="outline" className="ml-2">
                          {Object.keys(countryData.states).length} states/provinces
                        </Badge>
                      </div>
                      <div className="space-y-2 ml-6">
                        {Object.entries(countryData.states).map(([stateName, cities]) => (
                          <div key={stateName} className="border-l-2 border-gray-100 pl-4">
                            <div className="flex items-center mb-1">
                              <MapIcon className="mr-2 h-3 w-3 text-orange-600" />
                              <span className="text-sm font-medium">{stateName}</span>
                              {cities.length > 0 && (
                                <Badge variant="outline" size="sm" className="ml-2">
                                  {cities.length} cities
                                </Badge>
                              )}
                            </div>
                            {cities.length > 0 && (
                              <div className="flex flex-wrap gap-1 ml-5">
                                {cities.map((city) => (
                                  <div key={city} className="flex items-center">
                                    <Building className="mr-1 h-3 w-3 text-purple-600" />
                                    <span className="text-xs text-muted-foreground">{city}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationTagHierarchy;
