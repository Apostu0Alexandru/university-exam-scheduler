import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser
} from '@clerk/clerk-react';

// Create a Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Lazy load page components
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading component for lazy-loaded routes
const Loading = () => <div>Loading...</div>;

// Component to determine which dashboard to show based on user role
const RoleBasedDashboard: React.FC = () => {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <Loading />;
  
  // In a real app, you would fetch the user's role from your backend
  // For now, we'll assume all users are students
  const isAdmin = false;
  
  return isAdmin ? <AdminDashboard /> : <StudentDashboard />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <React.Suspense fallback={<Loading />}>
          <Routes>
            {/* Public routes */}
            <Route path="/sign-in/*" element={<SignedOut><div>Redirecting to Clerk Sign In...</div></SignedOut>} />
            <Route path="/sign-up/*" element={<SignedOut><div>Redirecting to Clerk Sign Up...</div></SignedOut>} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <>
                  <SignedIn>
                    <RoleBasedDashboard />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Not found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </Router>
    </ThemeProvider>
  );
};

export default App;
