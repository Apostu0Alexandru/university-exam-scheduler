import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  SignIn, 
  SignUp, 
  RedirectToSignIn, 
  useUser
} from '@clerk/clerk-react';

// Lazy load page components
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const CoursesPage = React.lazy(() => import('./pages/CoursesPage'));
const SchedulePage = React.lazy(() => import('./pages/SchedulePage'));

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

// Loading component for lazy-loaded routes
const Loading = () => <div>Loading...</div>;

// Protected route wrapper using Clerk hooks instead of components
const ProtectedRoute: React.FC<{element: React.ReactElement}> = ({ element }) => {
  const { isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded) return <Loading />;
  
  // If not signed in, redirect to sign in page
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }
  
  // User is signed in, show the requested component
  return element;
};

// Protected route wrapper specifically for dashboard
const ProtectedDashboardRoute: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded) return <Loading />;
  
  // If not signed in, redirect to sign in page
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }
  
  // In a real app, you would fetch the user's role from your backend
  const isAdmin = false;
  
  // User is signed in, show appropriate dashboard
  return isAdmin ? <AdminDashboard /> : <StudentDashboard />;
};

const App: React.FC = () => {
  const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

  if (!clerkPubKey) {
    console.warn("Missing Clerk Publishable Key - Authentication features may not work correctly");
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <React.Suspense fallback={<Loading />}>
          <Routes>
            {/* Authentication routes - using Clerk's built-in components */}
            <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
            <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
            
            {/* Protected routes - using our custom wrapper */}
            <Route path="/dashboard" element={<ProtectedDashboardRoute />} />
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Not found */}
            <Route path="*" element={<NotFound />} />
            
            {/* Protected routes */}
            <Route path="/courses" element={<ProtectedRoute element={<CoursesPage />} />} />
            <Route path="/schedule" element={<ProtectedRoute element={<SchedulePage />} />} />
          </Routes>
        </React.Suspense>
      </Router>
    </ThemeProvider>
  );
};

export default App;
