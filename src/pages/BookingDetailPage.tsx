
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  FilePlus2,
  Users,
  Briefcase,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Edit,
  Upload,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookingStatus, CommissionStatus, UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";

const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [notes, setNotes] = useState("Client requested window seat near the front of the aircraft. Travel insurance has been purchased separately.");

  // In a real app, you would fetch booking data based on the ID
  const booking = {
    id: id || "1",
    clients: [
      { id: "1", name: "John Smith" },
      { id: "2", name: "Jane Smith" }
    ],
    vendor: {
      id: "1",
      name: "Delta Airlines",
      commissionRate: 8,
      serviceTypes: ["Flight", "Transportation"]
    },
    trip: {
      id: "1",
      name: "European Adventure",
      startDate: "2023-06-15",
      endDate: "2023-06-25"
    },
    serviceType: "Flight",
    startDate: "2023-06-15",
    endDate: null,
    location: "New York (JFK) to Paris (CDG)",
    cost: 850,
    commissionRate: 8,
    commissionAmount: 68,
    bookingStatus: BookingStatus.Confirmed,
    isCompleted: false,
    commissionStatus: CommissionStatus.Unreceived,
    agent: {
      id: "1",
      name: "Michael Brown",
      email: "michael@abctravel.com"
    },
    documents: [
      { id: "1", name: "Flight Confirmation.pdf", uploadDate: "2023-05-01" },
      { id: "2", name: "E-Tickets.pdf", uploadDate: "2023-05-10" }
    ]
  };

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
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <FilePlus2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{booking.serviceType} Booking</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge className={getBookingStatusBadgeStyle(booking.bookingStatus)}>
                {booking.bookingStatus}
              </Badge>
              <span>•</span>
              <Badge className={getCommissionStatusBadgeStyle(booking.commissionStatus)} variant="outline">
                {booking.commissionStatus}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Booking
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground mb-2">Client(s)</dt>
                <dd>
                  <div className="space-y-2">
                    {booking.clients.map((client) => (
                      <div key={client.id} className="flex items-center rounded-md border px-3 py-2">
                        <Users className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>{client.name}</span>
                      </div>
                    ))}
                  </div>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Vendor</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.vendor.name}</span>
                </dd>
              </div>

              {booking.trip && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Associated Trip</dt>
                  <dd className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.trip.name}</span>
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Service Type</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{booking.serviceType}</Badge>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Date(s)</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div>{new Date(booking.startDate).toLocaleDateString()}</div>
                    {booking.endDate && (
                      <div className="text-sm text-muted-foreground">
                        to {new Date(booking.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                <dd className="flex items-start gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{booking.location}</span>
                </dd>
              </div>

              <div className="pt-2 border-t">
                <dt className="text-sm font-medium text-muted-foreground">Cost</dt>
                <dd className="text-lg font-medium mt-1">${booking.cost.toLocaleString()}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Commission Details</dt>
                <dd className="mt-1">
                  <div className="rounded-md border p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Rate</span>
                      <span>{booking.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="font-medium text-primary">${booking.commissionAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Booking Status</dt>
                <dd className="mt-1">
                  <div className="flex space-x-2">
                    <Button size="sm" variant={booking.bookingStatus === BookingStatus.Pending ? "default" : "outline"}>
                      Pending
                    </Button>
                    <Button size="sm" variant={booking.bookingStatus === BookingStatus.Confirmed ? "default" : "outline"}>
                      Confirmed
                    </Button>
                    <Button size="sm" variant={booking.bookingStatus === BookingStatus.Canceled ? "destructive" : "outline"}>
                      Canceled
                    </Button>
                  </div>
                </dd>
              </div>

              <RoleBasedComponent requiredRole={UserRole.Admin}>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Commission Status</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={booking.commissionStatus === CommissionStatus.Unreceived ? "default" : "outline"}>
                        Unreceived
                      </Button>
                      <Button size="sm" variant={booking.commissionStatus === CommissionStatus.Received ? "default" : "outline"}>
                        Received
                      </Button>
                      <Button size="sm" variant={booking.commissionStatus === CommissionStatus.Completed ? "default" : "outline"}>
                        Completed
                      </Button>
                      <Button size="sm" variant={booking.commissionStatus === CommissionStatus.Canceled ? "destructive" : "outline"}>
                        Canceled
                      </Button>
                    </div>
                  </dd>
                </div>
              </RoleBasedComponent>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Agent</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.agent.name}</span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 md:col-span-2">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Documents</h3>
                <Button variant="ghost" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
              <div className="space-y-2">
                {booking.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{doc.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Timeline</h3>
              <div className="rounded-md border">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm">Service Cost</span>
                    <span className="font-medium">${booking.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm">Commission ({booking.commissionRate}%)</span>
                    <span className="font-medium text-primary">${booking.commissionAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-medium">Net to Agency</span>
                    <span className="font-medium">${(booking.cost - booking.commissionAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingDetailPage;
