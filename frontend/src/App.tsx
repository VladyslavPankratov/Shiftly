import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SchedulePage from './pages/SchedulePage';
import EmployeesPage from './pages/EmployeesPage';
import ShiftTemplatesPage from './pages/ShiftTemplatesPage';
import { Navbar } from './components/layout/Navbar';
import { 
  ErrorBoundary, 
  PageErrorBoundary, 
  SectionErrorBoundary 
} from './components/errors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

// Wrapped page components with section error boundaries
function SchedulePageWithBoundary() {
  return (
    <SectionErrorBoundary title="Помилка завантаження розкладу">
      <SchedulePage />
    </SectionErrorBoundary>
  );
}

function EmployeesPageWithBoundary() {
  return (
    <SectionErrorBoundary title="Помилка завантаження працівників">
      <EmployeesPage />
    </SectionErrorBoundary>
  );
}

function TemplatesPageWithBoundary() {
  return (
    <SectionErrorBoundary title="Помилка завантаження шаблонів">
      <ShiftTemplatesPage />
    </SectionErrorBoundary>
  );
}

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary variant="component" title="Помилка навігації">
        <Navbar />
      </ErrorBoundary>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/schedule" />} />
          <Route path="/schedule" element={<SchedulePageWithBoundary />} />
          <Route path="/employees" element={<EmployeesPageWithBoundary />} />
          <Route path="/templates" element={<TemplatesPageWithBoundary />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <PageErrorBoundary title="Критична помилка додатку">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route 
              path="/login" 
              element={
                <SectionErrorBoundary title="Помилка сторінки входу">
                  <LoginPage />
                </SectionErrorBoundary>
              } 
            />
            <Route 
              path="/register" 
              element={
                <SectionErrorBoundary title="Помилка сторінки реєстрації">
                  <RegisterPage />
                </SectionErrorBoundary>
              } 
            />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <AuthenticatedApp />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </PageErrorBoundary>
  );
}

export default App;
