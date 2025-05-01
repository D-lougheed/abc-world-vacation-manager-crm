
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter,
  CreditCard,
  CircleCheck,
  CircleX,
  CircleDashed,
  User,
  ArrowUpDown,
  CalendarClock,
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
import { BookingStatus, CommissionStatus, UserRole } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import RoleBasedComponent from "@/components/RoleBasedComponent";

const CommissionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Dummy data
  const commissionSummary = {
    totalBookings: 120,
    totalCommission: 22480,
    confirmedCommission: 18500,
    agentCount: 5,
    unreceivedCommission: 12500,
    receivedCommission: 6250,
    completedCommission: 3730,
  };

  const bookings = [
    { 
      id: "1", 
      client: "Smith Family",
      vendor: "Delta Airlines", 
      agent: "Michael Brown",
      date: "2023-06-15", 
      bookingStatus: BookingStatus.Confirmed,
      commissionStatus: CommissionStatus.Unreceived,
      cost: 850, 
      commissionRate: 8, 
      commissionAmount: 68,
    },
    { 
      id: "2", 
      client: "Smith Family",
      vendor: "Hotel Splendid", 
      agent: "Michael Brown",
      date: "2023-06-15", 
      bookingStatus: BookingStatus.Confirmed,
      commissionStatus: CommissionStatus.Unreceived,
      cost: 1200, 
      commissionRate: 10, 
      commissionAmount: 120,
    },
    { 
      id: "3", 
      client: "Wilson Family",
      vendor: "Caribbean Cruises", 
      agent: "Sarah Johnson",
      date: "2023-07-10", 
      bookingStatus: BookingStatus.Pending,
      commissionStatus: CommissionStatus.Unreceived,
      cost: 2800, 
      commissionRate: 15, 
      commissionAmount: 420,
    },
    { 
      id: "4", 
      client: "Taylor Family",
      vendor: "Safari Adventures", 
      agent: "Michael Brown",
      date: "2023-04-05", 
      bookingStatus: BookingStatus.Confirmed,
      commissionStatus: CommissionStatus.Received,
      cost: 5200, 
      commissionRate: 18, 
      commissionAmount: 936,
    },
    { 
      id: "5", 
      client: "Brown Family",
      vendor: "NYC Hotels", 
      agent: "Sarah Johnson",
      date: "2023-05-25",
      bookingStatus: BookingStatus.Canceled,
      commissionStatus: CommissionStatus.Canceled,
      cost: 750, 
      commissionRate: 10, 
      commissionAmount: 75,
    },
    { 
      id: "6", 
      client: "Thompson Group",
      vendor: "Beach Resorts Ltd", 
      agent: "David Wilson",
      date: "2023-03-12", 
      bookingStatus: BookingStatus.Confirmed,
      commissionStatus: CommissionStatus.Completed,
      cost: 3200, 
      commissionRate: 12, 
      commissionAmount: 384,
    },
    { 
      id: "7", 
      client: "Garcia Family",
      vendor: "Tokyo Tours", 
      agent: "Jennifer Lee",
      date: "2023-08-20", 
      bookingStatus: BookingStatus.Confirmed,
      commissionStatus: CommissionStatus.Unreceived,
      cost: 4500, 
      commissionRate: 15, 
      commissionAmount: 675,
    },
    { 
      id: "8", 
      client: "Martinez Party",
      vendor: "European Rail", 
      agent: "Michael Brown",
      date: "2023-06-30", 
      bookingStatus: BookingStatus.Confirmed,
      commissionStatus: CommissionStatus.Unreceived,
      cost: 800, 
      commissionRate: 8, 
      commissionAmount: 64,
    },
  ];

  // Filter bookings based on search term
  const filteredBookings = bookings.filter((booking) => {
    const client = booking.client.toLowerCase();
    const vendor = booking.vendor.toLowerCase();
    const agent = booking.agent.toLowerCase();
    
    const searchString = searchTerm.toLowerCase();
    
    return (
      client.includes(searchString) ||
      vendor.includes(searchString) ||
      agent.includes(searchString)
    );
  });

  // Function to get commission status badge styling and icon
  const getCommissionStatusBadge = (status: CommissionStatus) => {
    switch (status) {
      case CommissionStatus.Received:
        return {
          style: "bg-green-100 text-green-800",
          icon: <CircleCheck className="h-4 w-4 mr-1" />
        };
      case CommissionStatus.Unreceived:
        return {
          style: "bg-yellow-100 text-yellow-800",
          icon: <CircleDashed className="h-4 w-4 mr-1" />
        };
      case CommissionStatus.Completed:
        return {
          style: "bg-blue-100 text-blue-800",
          icon: <CircleCheck className="h-4 w-4 mr-1" />
        };
      case CommissionStatus.Canceled:
        return {
          style: "bg-red-100 text-red-800",
          icon: <CircleX className="h-4 w-4 mr-1" />
        };
      default:
        return {
          style: "bg-gray-100 text-gray-800",
          icon: null
        };
    }
  };

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Commissions</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bookings"
            value={commissionSummary.totalBookings}
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard
            title="Total Commission"
            value={`$${commissionSummary.totalCommission.toLocaleString()}`}
            icon={<CreditCard className="h-5 w-5" />}
            description="From all bookings"
          />
          <StatCard
            title="Confirmed Commission"
            value={`$${commissionSummary.confirmedCommission.toLocaleString()}`}
            icon={<CircleCheck className="h-5 w-5" />}
            description="From confirmed bookings"
          />
          <StatCard
            title="Travel Agents"
            value={commissionSummary.agentCount}
            icon={<User className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Unreceived Commission"
            value={`$${commissionSummary.unreceivedCommission.toLocaleString()}`}
            icon={<CircleDashed className="h-5 w-5" />}
            className="bg-yellow-50"
          />
          <StatCard
            title="Received Commission"
            value={`$${commissionSummary.receivedCommission.toLocaleString()}`}
            icon={<CircleCheck className="h-5 w-5" />}
            className="bg-green-50"
          />
          <StatCard
            title="Completed Commission"
            value={`$${commissionSummary.completedCommission.toLocaleString()}`}
            icon={<CircleCheck className="h-5 w-5" />}
            className="bg-blue-50"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Commission Tracking</CardTitle>
            <CardDescription>Track and manage all booking commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client, vendor or agent..."
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
                    <TableHead>Client</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Agent
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Booking Status</TableHead>
                    <TableHead>Commission Status</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const commissionStatus = getCommissionStatusBadge(booking.commissionStatus);
                    
                    return (
                      <TableRow 
                        key={booking.id} 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        <TableCell>{booking.client}</TableCell>
                        <TableCell>{booking.vendor}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.agent}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(booking.date).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            booking.bookingStatus === BookingStatus.Confirmed
                              ? "bg-green-100 text-green-800"
                              : booking.bookingStatus === BookingStatus.Pending
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }>
                            {booking.bookingStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={commissionStatus.style} variant="outline">
                            <div className="flex items-center">
                              {commissionStatus.icon}
                              <span>{booking.commissionStatus}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">${booking.cost.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium text-primary">${booking.commissionAmount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{booking.commissionRate}%</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No commission data found. Try a different search term.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default CommissionsPage;
