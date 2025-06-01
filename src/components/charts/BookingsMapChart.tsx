
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Import Highcharts but don't initialize map module yet
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

        // Dynamically import Highcharts to avoid SSR issues
        const Highcharts = await import('highcharts');
        const HighchartsMap = await import('highcharts/modules/map');
        
        // Initialize the map module
        HighchartsMap.default(Highcharts.default);

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

        // Convert to format suitable for Highcharts
        const mapData = Array.from(countryMap.entries()).map(([country, count]) => ({
          'hc-key': country.toLowerCase().replace(/\s+/g, '-'),
          value: count,
          name: country
        }));

        console.log('Map data:', mapData);

        // Load world map topology
        const topologyResponse = await fetch('https://code.highcharts.com/mapdata/custom/world.topo.json');
        if (!topologyResponse.ok) {
          throw new Error('Failed to load map topology');
        }
        const topology = await topologyResponse.json();

        // Create the chart
        if (chartRef.current) {
          Highcharts.default.mapChart(chartRef.current, {
            chart: {
              map: topology,
              height: 600
            },
            title: {
              text: 'Bookings Distribution by Country'
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
                [0, '#EFEFFF'],
                [0.67, '#4444FF'],
                [1, '#000022']
              ]
            },
            series: [{
              type: 'map',
              name: 'Bookings',
              data: mapData,
              dataLabels: {
                enabled: true,
                format: '{point.name}'
              },
              allAreas: false,
              tooltip: {
                pointFormat: '{point.name}: <b>{point.value}</b> bookings'
              }
            }]
          });
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
      <div className="flex items-center justify-center h-96 bg-muted/10 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-medium text-destructive mb-2">Failed to load chart</div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading map data...</div>
      </div>
    );
  }

  return <div ref={chartRef} className="w-full h-96" />;
};

export default BookingsMapChart;
