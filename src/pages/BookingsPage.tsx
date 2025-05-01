
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  FilePlus2,
  Filter,
  CreditCard,
  Users,
  Briefcase,
  Calendar,
  Check,
  X,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingStatus, CommissionStatus } from "@/types";

const BookingsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Dummy data
  const bookings = [
    { 
      id: "1", 
      clients: ["John Smith", "Jane Smith"], 
      vendor: "Delta Airlines", 
      trip: "European Adventure",
      serviceType: "Flight", 
      startDate: "2023-06-15", 
      endDate: null, 
      location: "New York to Paris", 
      cost: 850, 
      commissionRate: 8, 
      commissionAmount: 68,
      bookingStatus: BookingStatus.Confirmed,
      isCompleted: false,
      commissionStatus: CommissionStatus.Unreceived,
      agent: "Michael Brown"
    },
    { 
      id: "2", 
      clients: ["John Smith", "Jane Smith"], 
      vendor: "Hotel Splendid", 
      trip: "European Adventure",
      serviceType: "Accommodation", 
      startDate: "2023-06-15", 
      endDate: "2023-06-20", 
      location: "Paris, France", 
      cost: 1200, 
      commissionRate: 10, 
      commissionAmount: 120,
      bookingStatus: BookingStatus.Confirmed,
      isCompleted: false,
      commissionStatus: CommissionStatus.Unreceived,
      agent: "Michael Brown"
    },
    { 
      id: "3", 
      clients: ["Robert Wilson"], 
      vendor: "Caribbean Cruises", 
      trip: "Caribbean Getaway",
      serviceType: "Cruise", 
      startDate: "2023-07-10", 
      endDate: "2023-07-17", 
      location: "Miami to Bahamas", 
      cost: 2800, 
      commissionRate: 15, 
      commissionAmount: 420,
      bookingStatus: BookingStatus.Pending,
      isCompleted: false,
      commissionStatus: CommissionStatus.Unreceived,
      agent: "Sarah Johnson"
    },
    { 
      id: "4", 
      clients: ["Taylor Family"], 
      vendor: "Safari Adventures", 
      trip: "African Safari",
      serviceType: "Tour", 
      startDate: "2023-04-05", 
      endDate: "2023-04-15", 
      location: "Kenya", 
      cost: 5200, 
      commissionRate: 18, 
      commissionAmount: 936,
      bookingStatus: BookingStatus.Confirmed,
      isCompleted: true,
      commissionStatus: CommissionStatus.Received,
      agent: "Michael Brown"
    },
    { 
      id: "5", 
      clients: ["Brown Family"], 
      vendor: "NYC Hotels", 
      trip: "NYC Weekend",
      serviceType: "Accommodation", 
      startDate: "2023-05-25", 
      endDate: "2023-05-28", 
      location: "New York City", 
      cost: 750, 
      commissionRate: 10, 
      commissionAmount: 75,
      bookingStatus: BookingStatus.Canceled,
      isCompleted: false,
      commissionStatus: CommissionStatus.Canceled,
      agent: "Sarah Johnson"
    },
  ];

  // Filter bookings based on search term
  const filteredBookings = bookings.filter((booking) => {
    const clientNames = booking.clients.join(" ").toLowerCase();
    const vendor = booking.vendor.toLowerCase();
    const trip = booking.trip?.toLowerCase() || "";
    const serviceType = booking.serviceType.toLowerCase();
    const location = booking.location.toLowerCase();
    
    const searchString = searchTerm.toLowerCase();
    
    return (
      clientNames.includes(searchString) ||
      vendor.includes(searchString) ||
      trip.includes(searchString) ||
      serviceType.includes(searchString) ||
      location.includes(searchString)
    );
  });

  // Function to get booking status badge styling
  const getBookingStatusBadgeStyle = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Confirmed:
        return "bg-green-100 text-green-800";
      case BookingStatus.Pending:
        return "bg-yellow-100 text-yellow-800";
      case BookingStatus.Canceled:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get commission status badge styling
  const getCommissionStatusBadgeStyle = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.Received:
        return "bg-green-100 text-green-800";
      case CommissionStatus.Unreceived:
        return "bg-yellow-100 text-yellow-800";
      case CommissionStatus.Completed:
        return "bg-blue-100 text-blue-800";
      case CommissionStatus.Canceled:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <Button onClick={() => navigate("/bookings/new")}>
          <FilePlus2 className="mr-2 h-4 w-4" />
          Create New Booking
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Booking Management</CardTitle>
          <CardDescription>View and manage all client bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client(s)</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow 
                    key={booking.id} 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.clients.join(", ")}</span>
                      </div>
                      {booking.trip && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {booking.trip}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.serviceType}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {booking.vendor}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                      </div>
                      {booking.endDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          to {new Date(booking.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${booking.cost.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">${booking.commissionAmount.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {booking.commissionRate}% rate
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Badge className={getBookingStatusBadgeStyle(booking.bookingStatus)}>
                          {booking.isCompleted ? <Check className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                          {booking.bookingStatus}
                        </Badge>
                        <Badge className={getCommissionStatusBadgeStyle(booking.commissionStatus)} variant="outline">
                          {booking.commissionStatus}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No bookings found. Try a different search term or create a new booking.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsPage;
