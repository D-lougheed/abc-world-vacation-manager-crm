
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import VendorsPage from "./pages/VendorsPage";
import VendorDetailPage from "./pages/VendorDetailPage";
import TripsPage from "./pages/TripsPage";
import TripDetailPage from "./pages/TripDetailPage";
import BookingsPage from "./pages/BookingsPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import NewBookingPage from "./pages/NewBookingPage";
import EditBookingPage from "./pages/EditBookingPage";
import CommissionsPage from "./pages/CommissionsPage";
import AdminPage from "./pages/AdminPage";
import AgentsPage from "./pages/AgentsPage";
import AddAgentPage from "./pages/AddAgentPage";
import ServiceTypesPage from "./pages/ServiceTypesPage";
import TagsPage from "./pages/TagsPage";
import BatchEditTagsPage from "./pages/BatchEditTagsPage"; // Import the new page
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";

// Import pages for Mass Import
import AdminImportOverviewPage from "./pages/AdminImportOverviewPage";
import ClientImportPage from "./pages/ClientImportPage";
import VendorImportPage from "./pages/VendorImportPage";
import ServiceTypeImportPage from "./pages/ServiceTypeImportPage";
import TagImportPage from "./pages/TagImportPage";

// Import Audit Log Page
import AdminAuditLogPage from "./pages/AdminAuditLogPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <AppLayout />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/vendors/:id" element={<VendorDetailPage />} />
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/trips/:id" element={<TripDetailPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/bookings/new" element={<NewBookingPage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/bookings/:id/edit" element={<EditBookingPage />} />
              <Route path="/commissions" element={<CommissionsPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/agents" element={<AgentsPage />} />
              <Route path="/admin/agents/new" element={<AddAgentPage />} />
              <Route path="/admin/service-types" element={<ServiceTypesPage />} />
              <Route path="/admin/tags" element={<TagsPage />} />
              <Route path="/admin/tags/batch-edit" element={<BatchEditTagsPage />} /> {/* New Route for Batch Edit Tags */}
              <Route path="/admin/audit-logs" element={<AdminAuditLogPage />} />

              {/* Mass Import Routes */}
              <Route path="/admin/import" element={<AdminImportOverviewPage />} />
              <Route path="/admin/import/clients" element={<ClientImportPage />} />
              <Route path="/admin/import/vendors" element={<VendorImportPage />} />
              <Route path="/admin/import/service-types" element={<ServiceTypeImportPage />} />
              <Route path="/admin/import/tags" element={<TagImportPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
