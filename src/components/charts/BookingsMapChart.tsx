
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import * as Highcharts from 'highcharts';
import HighchartsMap from 'highcharts/modules/map';

// Initialize the map module
HighchartsMap(Highcharts);

interface CountryBookingData {
  country: string;
  count: number;
  'hc-key': string;
}

const BookingsMapChart = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookingsData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch bookings with location tags
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(`
            id,
            location_tag_id,
            location_tags (
              country
            )
          `);

        if (error) throw error;

        // Count bookings by country
        const countryMap = new Map<string, number>();
        
        bookings?.forEach(booking => {
          if (booking.location_tags?.country) {
            const country = booking.location_tags.country;
            countryMap.set(country, (countryMap.get(country) || 0) + 1);
          }
        });

        // Convert to format suitable for Highcharts
        const mapData: CountryBookingData[] = Array.from(countryMap.entries()).map(([country, count]) => ({
          country,
          count,
          'hc-key': country.toLowerCase().replace(/\s+/g, '-')
        }));

        // Load world map topology
        const topology = await fetch('https://code.highcharts.com/mapdata/custom/world.topo.json').then(res => res.json());

        // Create the chart
        if (chartRef.current) {
          Highcharts.mapChart(chartRef.current, {
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
              data: mapData.map(item => ({
                'hc-key': item['hc-key'],
                value: item.count,
                name: item.country
              })),
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
        console.error('Error fetching bookings data:', error);
        toast({
          title: "Error",
          description: "Failed to load bookings data for the map",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingsData();
  }, [toast]);

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
