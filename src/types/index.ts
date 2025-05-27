export enum UserRole {
  SuperAdmin = "SuperAdmin",
  Admin = "Admin",
  Agent = "Agent"
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName:string;
  role: UserRole;
  isActive: boolean;
  agentCommissionPercentage?: number | null; // Added
  acceptingNewBookings?: boolean; // Added
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
  clients: Client[] | string[];
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

export enum BillingStatus {
  Draft = "Draft",
  AwaitingDeposit = "Awaiting Deposit",
  AwaitingFinalPayment = "Awaiting Final Payment",
  Paid = "Paid"
}

export interface Booking {
  id: string;
  clients: Client[] | string[];
  vendor: Vendor | string;
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
  agent: User | string;
  notes?: string;
  files?: string[];
  billingStatus?: BillingStatus;
  depositAmount?: number | null;
  finalPaymentDueDate?: string | null;
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
