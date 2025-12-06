import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi } from '../api/authApi';

const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Verify authentication by checking cookie via API call
    // Cookie is httpOnly so we can't read it directly, but we can verify via API
    const checkAuth = async () => {
      try {
        // Try to get user profile - if cookie is valid, this will succeed
        const userData = await authApi.getProfile();
        setIsAuth(true);
        // Update localStorage with latest user data
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        // If API call fails, user is not authenticated
        setIsAuth(false);
        // Clear localStorage if token is invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Show nothing while checking
  if (isChecking) {
    return null;
  }

  // If user is not authenticated (cookie is invalid), redirect to login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
