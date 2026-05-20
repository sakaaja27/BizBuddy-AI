import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && user && !user.isOnboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is accessing onboarding but already completed it
  if (!requireOnboarding && user && user.isOnboardingComplete) {
     return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
