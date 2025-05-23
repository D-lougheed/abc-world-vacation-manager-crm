
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";

import {
  Home,
  Users,
  Briefcase,
  Calendar,
  CalendarCheck,
  CreditCard,
  Settings,
  Plane,
  // UploadCloud, // No longer used directly in sidebar for a top-level item
  // FileText, // No longer used directly in sidebar for a top-level item
} from "lucide-react";
import RoleBasedComponent from "../RoleBasedComponent";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  to,
  active = false,
}) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const { isSidebarOpen } = useSidebar();
  const { checkUserAccess } = useAuth(); 
  const location = useLocation();
  const pathname = location.pathname;

  // const canAccessAdmin = checkUserAccess(UserRole.Admin); // This variable is declared but not used. Can be removed if not needed elsewhere.

  if (!isSidebarOpen) return null;

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r bg-sidebar shadow-sm transition-all">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Plane className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold tracking-tight">
          ABC World Vacations
        </h1>
      </div>
      <nav className="space-y-1 p-2">
        <SidebarItem
          icon={Home}
          label="Dashboard"
          to="/dashboard"
          active={pathname === "/dashboard"}
        />
        <SidebarItem
          icon={Users}
          label="Clients"
          to="/clients"
          active={pathname.startsWith("/clients")}
        />
        <SidebarItem
          icon={Briefcase}
          label="Vendors"
          to="/vendors"
          active={pathname.startsWith("/vendors")}
        />
        <SidebarItem
          icon={Calendar}
          label="Trips"
          to="/trips"
          active={pathname.startsWith("/trips")}
        />
        <SidebarItem
          icon={CalendarCheck}
          label="Bookings"
          to="/bookings"
          active={pathname.startsWith("/bookings")}
        />
        
        <RoleBasedComponent requiredRole={UserRole.Admin}>
          <SidebarItem
            icon={CreditCard}
            label="Commissions"
            to="/commissions"
            active={pathname === "/commissions"}
          />
          <SidebarItem
            icon={Settings}
            label="Admin Panel"
            to="/admin"
            active={pathname.startsWith("/admin") && !pathname.startsWith("/admin/import")}
          />
          {/* The SidebarItem for Audit Logs has been removed. */}
          {/* Access to Audit Logs is now through the Admin Panel page. */}
          {/* The Admin Panel link above will be active when on /admin/audit-logs */}
        </RoleBasedComponent>
      </nav>
    </aside>
  );
};

export default Sidebar;
