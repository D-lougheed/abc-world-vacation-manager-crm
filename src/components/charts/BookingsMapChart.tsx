
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CountryBookingData {
  country: string;
  count: number;
}

const BookingsMapChart = () => {
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

        // Convert to array format and sort by count
        const data = Array.from(countryMap.entries())
          .map(([country, count]) => ({
            country,
            count
          }))
          .sort((a, b) => b.count - a.count);

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
    <div className="space-y-4">
      <div className="text-center text-muted-foreground mb-4">
        Bookings Distribution by Country
      </div>
      
      {countryData.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {countryData.map((item, index) => (
            <Card key={item.country} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{item.country}</span>
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{item.count}</div>
                <div className="text-xs text-muted-foreground">
                  {item.count === 1 ? 'booking' : 'bookings'}
                </div>
                
                {/* Visual bar representation */}
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(10, (item.count / Math.max(...countryData.map(d => d.count))) * 100)}%`
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border">
          <div className="text-lg font-medium mb-2">No booking data available</div>
          <div className="text-sm">Bookings with location data will appear here</div>
        </div>
      )}
    </div>
  );
};

export default BookingsMapChart;
