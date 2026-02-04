import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';
import { UserRole } from '../services/authService';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Role-based route protection component
 * Only allows access if user has one of the allowed roles
 */
export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/unauthorized',
}) => {
  const { user, isAuthenticated, initialCheckDone } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Wait for initial auth check
  if (!initialCheckDone) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

interface PermissionBasedRouteProps {
  children: React.ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean; // true = all permissions required, false = any permission required
  redirectTo?: string;
}

/**
 * Permission-based route protection component
 * Only allows access if user has required permissions
 */
export const PermissionBasedRoute: React.FC<PermissionBasedRouteProps> = ({
  children,
  requiredPermissions,
  requireAll = true,
  redirectTo = '/unauthorized',
}) => {
  const { user, isAuthenticated, initialCheckDone } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Wait for initial auth check
  if (!initialCheckDone) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin has all permissions
  if (user.permissions.includes('*')) {
    return <>{children}</>;
  }

  // Check permissions
  const hasPermission = requireAll
    ? requiredPermissions.every((perm) => user.permissions.includes(perm))
    : requiredPermissions.some((perm) => user.permissions.includes(perm));

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
