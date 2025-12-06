import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi } from '../api/authApi';

const PublicRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Verify cookie exists by making API call
    // Cookie is httpOnly so we verify it by checking if API call succeeds
    const checkCookie = async () => {
      try {
        // API call will automatically send cookie, if cookie is valid, this succeeds
        await authApi.getProfile();
        setIsAuth(true);
      } catch (error) {
        // If API call fails, cookie is invalid or doesn't exist
        setIsAuth(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } finally {
        setIsChecking(false);
      }
    };

    checkCookie();
  }, []);

  // Show nothing while checking cookie
  if (isChecking) {
    return null;
  }

  // If cookie is valid (user is authenticated), redirect to dashboard
  if (isAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
