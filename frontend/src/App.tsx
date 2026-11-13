import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Layout } from './components/layout/Layout';
import { Overview } from './pages/Overview';
import { Accounts } from './pages/Accounts';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { Bills } from './pages/Bills';
import { Insights } from './pages/Insights';
import { FamilyPage } from './pages/Family';
import { SettingsPage } from './pages/Settings';
import { Login } from './pages/Login';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f15]">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10b981] border-t-transparent" />
          <p className="text-xs text-[#64748b]">Verifying vault credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="goals" element={<Goals />} />
              <Route path="bills" element={<Bills />} />
              <Route path="insights" element={<Insights />} />
              <Route path="family" element={<FamilyPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CurrencyProvider>
    </AuthProvider>
  );
};

export default App;
