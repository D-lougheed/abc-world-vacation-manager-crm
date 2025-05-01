
import { CalendarCheck, Users, Plane, CreditCard, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

const DashboardPage = () => {
  // This would come from your API in a real application
  const helpfulLinks = [
    { id: "1", title: "Travel Insurance Partners", url: "#", description: "Access special agent rates" },
    { id: "2", title: "Airline Booking Portal", url: "#", description: "Direct booking links" },
    { id: "3", title: "Hotel Reservation System", url: "#" },
    { id: "4", title: "Cruise Line Contacts", url: "#" },
  ];

  const activeTrips = [
    { id: "1", name: "European Adventure", clients: "Smith Family", startDate: "2023-05-15", endDate: "2023-05-25" },
    { id: "2", name: "Caribbean Cruise", clients: "Johnson & Williams", startDate: "2023-05-20", endDate: "2023-05-27" },
  ];

  const upcomingTrips = [
    { id: "3", name: "Asian Tour", clients: "Garcia Family", startDate: "2023-06-05", endDate: "2023-06-20" },
    { id: "4", name: "African Safari", clients: "Taylor Group", startDate: "2023-06-15", endDate: "2023-06-25" },
    { id: "5", name: "Australian Outback", clients: "Brown Party", startDate: "2023-07-01", endDate: "2023-07-14" },
  ];

  const recentBookings = [
    { id: "1", clients: "Smith Family", service: "Hotel Booking", vendor: "Marriott", date: "2023-05-10" },
    { id: "2", clients: "Johnson Group", service: "Flight", vendor: "Delta Airlines", date: "2023-05-08" },
    { id: "3", clients: "Williams Party", service: "Car Rental", vendor: "Hertz", date: "2023-05-05" },
  ];

  const highPriorityTrips = [
    { id: "1", name: "Last-minute Cancun", clients: "Martinez Family", startDate: "2023-05-18", status: "Confirmed" },
    { id: "2", name: "Rush NYC Weekend", clients: "Wilson Party", startDate: "2023-05-20", status: "Pending" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Trips" 
          value="12" 
          icon={<Plane className="h-5 w-5" />}
          trend={8}
        />
        <StatCard 
          title="Total Clients" 
          value="486" 
          icon={<Users className="h-5 w-5" />}
          trend={12}
        />
        <StatCard 
          title="Bookings This Month" 
          value="54" 
          icon={<CalendarCheck className="h-5 w-5" />}
          trend={-3}
        />
        <StatCard 
          title="Commission (YTD)" 
          value="$24,895" 
          icon={<CreditCard className="h-5 w-5" />}
          trend={15}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Helpful Links">
          <div className="space-y-2">
            {helpfulLinks.map((link) => (
              <Card key={link.id} className="p-3 hover:bg-muted/50 cursor-pointer">
                <a href={link.url} className="text-sm font-medium">{link.title}</a>
                {link.description && (
                  <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                )}
              </Card>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Active Trips">
          <div className="space-y-2">
            {activeTrips.map((trip) => (
              <Card key={trip.id} className="p-3 hover:bg-muted/50 cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{trip.name}</p>
                    <p className="text-xs text-muted-foreground">{trip.clients}</p>
                  </div>
                  <div className="text-xs text-right">
                    <p className="text-foreground">{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Upcoming Trips">
          <div className="space-y-2">
            {upcomingTrips.map((trip) => (
              <Card key={trip.id} className="p-3 hover:bg-muted/50 cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{trip.name}</p>
                    <p className="text-xs text-muted-foreground">{trip.clients}</p>
                  </div>
                  <div className="text-xs text-right">
                    <p className="text-foreground">{new Date(trip.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCard title="High Priority Trips">
          <div className="space-y-2">
            {highPriorityTrips.map((trip) => (
              <Card key={trip.id} className="p-3 hover:bg-muted/50 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{trip.name}</p>
                    <p className="text-xs text-muted-foreground">{trip.clients}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs">{new Date(trip.startDate).toLocaleDateString()}</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      trip.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Recent Bookings">
          <div className="space-y-2">
            {recentBookings.map((booking) => (
              <Card key={booking.id} className="p-3 hover:bg-muted/50 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{booking.service}</p>
                    <p className="text-xs text-muted-foreground">{booking.clients} • {booking.vendor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs">{new Date(booking.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default DashboardPage;
