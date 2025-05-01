
export enum UserRole {
  SuperAdmin = 1,
  Admin = 2,
  Agent = 3
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dateCreated: string;
  lastUpdated: string;
  notes?: string;
  documents?: string[];
  trips?: Trip[];
  bookings?: Booking[];
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  serviceTypes: ServiceType[];
  serviceArea: string;
  commissionRate: number;
  priceRange: number;
  rating: number;
  tags: Tag[];
  notes?: string;
  files?: string[];
}

export enum TripStatus {
  Planned = "Planned",
  Ongoing = "Ongoing",
  Completed = "Completed",
  Canceled = "Canceled"
}

export interface Trip {
  id: string;
  name: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
  isHighPriority: boolean;
  description?: string;
  clients: Client[];
  notes?: string;
  bookings?: Booking[];
}

export enum BookingStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  Canceled = "Canceled"
}

export enum CommissionStatus {
  Unreceived = "Unreceived",
  Received = "Received",
  Canceled = "Canceled",
  Completed = "Completed"
}

export interface Booking {
  id: string;
  clients: Client[];
  vendor: Vendor;
  trip?: Trip;
  serviceType: ServiceType;
  startDate: string;
  endDate: string;
  location: string;
  cost: number;
  commissionRate: number;
  commissionAmount: number;
  bookingStatus: BookingStatus;
  isCompleted: boolean;
  commissionStatus: CommissionStatus;
  agent: User;
  notes?: string;
  files?: string[];
}

export interface ServiceType {
  id: string;
  name: string;
  tags: Tag[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface HelpfulLink {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface CommissionSummary {
  totalBookings: number;
  totalCommission: number;
  confirmedCommission: number;
  agentCount: number;
  unreceivedCommission: number;
  receivedCommission: number;
  completedCommission: number;
}
