
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface RoleBasedComponentProps {
  requiredRole: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  requiredRole,
  children,
  fallback = null,
}) => {
  const { checkUserAccess } = useAuth();
  const hasAccess = checkUserAccess(requiredRole);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleBasedComponent;
