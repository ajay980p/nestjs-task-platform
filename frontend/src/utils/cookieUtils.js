// Check if user is authenticated
// Since cookie is httpOnly (cannot be accessed via JavaScript),
// we check localStorage for user data as indicator of authentication
// The actual token is in httpOnly cookie which is sent automatically with requests
export const isAuthenticated = () => {
  // Check if user data exists in localStorage (set after login)
  const user = localStorage.getItem('user');
  return user !== null && user !== undefined && user !== '';
};

