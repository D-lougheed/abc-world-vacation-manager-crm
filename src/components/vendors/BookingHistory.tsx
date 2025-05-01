
import { DollarSign } from "lucide-react";

interface Booking {
  id: string;
  start_date: string;
  cost: number;
  commission_amount: number;
  booking_status: string;
  location: string;
  service_types: {
    name: string;
  };
}

interface BookingHistoryProps {
  bookings: Booking[];
}

const BookingHistory = ({ bookings }: BookingHistoryProps) => {
  return (
    <div className="space-y-3">
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <div 
            key={booking.id} 
            className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50"
          >
            <div>
              <p className="font-medium">{booking.service_types?.name || "Service"}</p>
              <div className="text-sm text-muted-foreground">
                {booking.location} • {new Date(booking.start_date).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium">${booking.cost}</p>
                <p className="text-xs text-primary">${booking.commission_amount} commission</p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                booking.booking_status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}>
                {booking.booking_status}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center py-8 text-muted-foreground">No bookings found for this vendor.</p>
      )}
    </div>
  );
};

export default BookingHistory;
