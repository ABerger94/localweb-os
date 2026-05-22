import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// Add page imports here
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import Projects from '@/pages/Projects';
import Invoices from '@/pages/Invoices';
import Retainers from '@/pages/Retainers';
import Designer from '@/pages/Designer';
import ClientPortal from '@/pages/ClientPortal';
import ClientPortalProjects from '@/pages/ClientPortalProjects';
import ClientPortalInvoices from '@/pages/ClientPortalInvoices';



const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Redirect non-admin users straight to client portal
  if (user && user.role === 'user') {
    return (
      <Routes>
        <Route path="/client-portal" element={<ClientPortal />} />
        <Route path="/client-portal/projects" element={<ClientPortalProjects />} />
        <Route path="/client-portal/invoices" element={<ClientPortalInvoices />} />
        <Route path="*" element={<Navigate to="/client-portal" replace />} />
      </Routes>
    );
  }

  // Render the main app
  return (
    <Routes>
      {/* Agency Routes */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/invoices" element={<Invoices />} />
      <Route path="/retainers" element={<Retainers />} />
      <Route path="/designer" element={<Designer />} />
      
      {/* Client Portal Routes */}
      <Route path="/client-portal" element={<ClientPortal />} />
      <Route path="/client-portal/projects" element={<ClientPortalProjects />} />
      <Route path="/client-portal/invoices" element={<ClientPortalInvoices />} />
      
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App