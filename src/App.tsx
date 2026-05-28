import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Spinner } from './components/ui/Spinner';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import './pages/GoalsPage.css';
import './pages/SalesPage.css';
import './pages/SimulatorPage.css';
import './pages/PaymentsPage.css';
import './pages/AlertsPage.css';
import './pages/DashboardPage.css';
import './components/ui/Dialog.css';
import './components/ui/Toast.css';
import './components/ui/Spinner.css';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage').then((m) => ({ default: m.SimulatorPage })));
const SalesPage = lazy(() => import('./pages/SalesPage').then((m) => ({ default: m.SalesPage })));
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((m) => ({ default: m.GoalsPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then((m) => ({ default: m.AlertsPage })));

function PageFallback() {
  return <Spinner />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Suspense fallback={<PageFallback />}><DashboardPage /></Suspense>} />
              <Route path="alertas" element={<Suspense fallback={<PageFallback />}><AlertsPage /></Suspense>} />
              <Route path="simulador" element={<Suspense fallback={<PageFallback />}><SimulatorPage /></Suspense>} />
              <Route path="ventas" element={<Suspense fallback={<PageFallback />}><SalesPage /></Suspense>} />
              <Route path="metas" element={<Suspense fallback={<PageFallback />}><GoalsPage /></Suspense>} />
              <Route path="pagos" element={<Suspense fallback={<PageFallback />}><PaymentsPage /></Suspense>} />
              <Route path="negocio" element={<Navigate to="/dashboard" replace />} />
              <Route path="negocios" element={<Navigate to="/dashboard" replace />} />
              <Route path="rentabilidad" element={<Navigate to="/ventas" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
