import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MainLayout, ErrorBoundary, LoadingPage, ProtectedRoute } from './components';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { checkHealth } from './lib/api';
import { IssuesPage } from './pages/Issues';
import { IssueDetailPage } from './pages/IssueDetail';
import { Radio, CheckCircle, XCircle, Bug, ListTodo, BookOpen } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Simple hash-based routing
function useRoute() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  return { route, navigate };
}

function Dashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user } = useAuth();
  const [healthStatus, setHealthStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await checkHealth();
        if (response.status === 'ok') {
          setHealthStatus('ok');
        } else {
          setHealthStatus('error');
          setErrorMessage('Unexpected response from server');
        }
      } catch (error) {
        setHealthStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to backend');
      }
    };

    checkBackendHealth();
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-relay-gradient shadow-lg">
              <Radio className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Welcome back, <span className="text-relay-gradient">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Fast track from report to resolution
          </p>
        </div>

        {/* Status Card */}
        <div className="w-full max-w-md mb-8">
          <div className="glassmorphism dark:glassmorphism-dark rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              System Status
            </h2>

            {healthStatus === 'loading' && <LoadingPage />}

            {healthStatus === 'ok' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Backend Connected
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    All systems operational
                  </p>
                </div>
              </div>
            )}

            {healthStatus === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Backend Unavailable
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorMessage || 'Unable to connect to server'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          <button className="group p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-relay-orange dark:hover:border-relay-orange transition-colors text-left">
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 group-hover:bg-relay-gradient transition-colors">
              <Bug className="w-6 h-6 text-red-600 dark:text-red-400 group-hover:text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Report Bug
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found an issue? Let us know
            </p>
          </button>

          <button className="group p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-relay-orange dark:hover:border-relay-orange transition-colors text-left">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:bg-relay-gradient transition-colors">
              <ListTodo className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Create Task
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Request a new feature or task
            </p>
          </button>

          <button
            onClick={() => onNavigate('/issues')}
            className="group p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-relay-orange dark:hover:border-relay-orange transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:bg-relay-gradient transition-colors">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              View Issues
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse all reported issues
            </p>
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

function AppRouter() {
  const { route, navigate } = useRoute();

  // Match issue detail route: /issues/KEY-123
  const issueDetailMatch = route.match(/^\/issues\/([A-Z]+-\d+)$/);
  if (issueDetailMatch) {
    const issueKey = issueDetailMatch[1];
    return (
      <IssueDetailPage
        issueKey={issueKey}
        onBack={() => navigate('/issues')}
      />
    );
  }

  // Match issues list route
  if (route === '/issues' || route.startsWith('/issues?')) {
    return <IssuesPage />;
  }

  return <Dashboard onNavigate={navigate} />;
}

function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <ProtectedRoute>
            <AppRouter />
          </ProtectedRoute>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
