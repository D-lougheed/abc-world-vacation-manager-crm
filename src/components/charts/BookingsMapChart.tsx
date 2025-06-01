
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import Highcharts from 'highcharts';
import HighchartsMap from 'highcharts/modules/map';

// Initialize the map module
if (typeof Highcharts === 'object') {
  HighchartsMap(Highcharts);
}

const BookingsMapChart = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeChart = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Starting chart initialization...');

        // Fetch bookings with location tags
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            location_tag_id,
            location_tags (
              country
            )
          `);

        if (bookingsError) {
          console.error('Supabase error:', bookingsError);
          throw new Error('Failed to fetch bookings data');
        }

        console.log('Fetched bookings:', bookings);

        // Count bookings by country
        const countryMap = new Map<string, number>();
        
        if (bookings) {
          bookings.forEach(booking => {
            if (booking.location_tags?.country) {
              const country = booking.location_tags.country;
              countryMap.set(country, (countryMap.get(country) || 0) + 1);
            }
          });
        }

        console.log('Country map:', countryMap);

        // Convert to format suitable for Highcharts with proper country codes
        const mapData = Array.from(countryMap.entries()).map(([country, count]) => {
          // Simple country name to ISO code mapping for common countries
          const countryCodeMap: { [key: string]: string } = {
            'United States': 'us',
            'Canada': 'ca',
            'United Kingdom': 'gb',
            'France': 'fr',
            'Germany': 'de',
            'Italy': 'it',
            'Spain': 'es',
            'Japan': 'jp',
            'Australia': 'au',
            'Brazil': 'br',
            'India': 'in',
            'China': 'cn',
            'Mexico': 'mx',
            'Thailand': 'th',
            'Greece': 'gr',
            'Turkey': 'tr',
            'Egypt': 'eg',
            'South Africa': 'za'
          };

          return {
            'hc-key': countryCodeMap[country] || country.toLowerCase().replace(/\s+/g, '-'),
            value: count,
            name: country
          };
        });

        console.log('Map data prepared:', mapData);

        // If no data, show empty chart
        if (mapData.length === 0) {
          console.log('No booking data available');
          setError('No booking data available for map visualization');
          setIsLoading(false);
          return;
        }

        // Load world map topology with error handling
        let topology;
        try {
          console.log('Loading map topology...');
          const topologyResponse = await fetch('https://code.highcharts.com/mapdata/custom/world.topo.json');
          if (!topologyResponse.ok) {
            throw new Error(`Failed to load map topology: ${topologyResponse.status}`);
          }
          topology = await topologyResponse.json();
          console.log('Map topology loaded successfully');
        } catch (topologyError) {
          console.error('Topology loading error:', topologyError);
          throw new Error('Failed to load world map data');
        }

        // Create the chart
        if (chartRef.current && topology) {
          console.log('Creating Highcharts map...');
          
          Highcharts.mapChart(chartRef.current, {
            chart: {
              map: topology,
              height: 500,
              backgroundColor: '#ffffff'
            },
            title: {
              text: 'Bookings Distribution by Country',
              style: {
                fontSize: '18px',
                fontWeight: 'bold'
              }
            },
            subtitle: {
              text: 'Number of bookings per country'
            },
            mapNavigation: {
              enabled: true,
              buttonOptions: {
                verticalAlign: 'bottom'
              }
            },
            colorAxis: {
              min: 0,
              stops: [
                [0, '#E3F2FD'],
                [0.5, '#2196F3'],
                [1, '#0D47A1']
              ],
              labels: {
                format: '{value}'
              }
            },
            legend: {
              title: {
                text: 'Number of Bookings'
              }
            },
            series: [{
              type: 'map',
              name: 'Bookings',
              data: mapData,
              dataLabels: {
                enabled: false
              },
              allAreas: false,
              tooltip: {
                pointFormat: '<b>{point.name}</b>: {point.value} booking(s)'
              },
              states: {
                hover: {
                  color: '#FF5722'
                }
              }
            }]
          });

          console.log('Chart created successfully');
        }

      } catch (error: any) {
        console.error('Error initializing chart:', error);
        setError(error.message || 'Failed to load map chart');
        toast({
          title: "Error",
          description: "Failed to load bookings map chart",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeChart();
  }, [toast]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/10 rounded-lg border">
        <div className="text-center p-6">
          <div className="text-lg font-medium text-destructive mb-2">Failed to load map chart</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <div className="text-xs text-muted-foreground mt-2">
            Check the console for more details
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/10 rounded-lg border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg">Loading map data...</div>
          <div className="text-sm text-muted-foreground">This may take a few moments</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={chartRef} className="w-full h-96 min-h-96" />
    </div>
  );
};

export default BookingsMapChart;
