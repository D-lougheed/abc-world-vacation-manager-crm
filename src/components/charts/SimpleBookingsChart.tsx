
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CountryBookingData {
  country: string;
  count: number;
}

const SimpleBookingsChart = () => {
  const [countryData, setCountryData] = useState<CountryBookingData[]>([]);
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

        // Convert to array format
        const data = Array.from(countryMap.entries()).map(([country, count]) => ({
          country,
          count
        }));

        setCountryData(data);

      } catch (error: any) {
        console.error('Error fetching bookings data:', error);
        toast({
          title: "Error",
          description: "Failed to load bookings data",
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
        <div className="text-lg">Loading bookings data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center text-muted-foreground mb-4">
        Bookings by Country (Simple View)
      </div>
      
      {countryData.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {countryData.map((item) => (
            <Card key={item.country}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{item.country}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-xs text-muted-foreground">bookings</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No booking data available
        </div>
      )}
    </div>
  );
};

export default SimpleBookingsChart;
