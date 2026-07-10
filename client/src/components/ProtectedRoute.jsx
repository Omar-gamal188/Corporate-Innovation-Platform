import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Gates a route behind authentication and, optionally, a role whitelist.
 * This is a UX convenience only — the API enforces the real authorization,
 * so hiding a page here never substitutes for a server-side check.
 */
function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
