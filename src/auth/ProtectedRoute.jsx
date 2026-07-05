import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

// Component to guard routes requiring authentication
export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, profile, isInitialLoading } = useAuth();
  const location = useLocation();

  // Still checking auth state - show nothing
  // Why: Prevents redirect flash for authenticated users
  if (isInitialLoading) {
    return null;
  }

  // Not authenticated - redirect to login
  if (!user) {
    // Save attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access control
  // Why: Single component handles both auth and authorization
  if (allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = profile.role === 'admin' ? '/admin' : '/intern';
    return <Navigate to={redirectPath} replace />;
  }

  // Authorized - render children
  return children;
}

// Higher-order component alternative for class components or specific use cases
export function withAuth(WrappedComponent, allowedRoles = []) {
  return function WithAuthComponent(props) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}