import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthPage } from './components/auth/AuthPage.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { useAuthStore } from './stores/authStore.js';
import { Kanban, LogOut } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

const TempDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#1D2125] text-white flex flex-col">
      <header className="h-14 border-b border-[#38414A] bg-[#181C20] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#579DFF] flex items-center justify-center text-[#003062] font-bold">
            <Kanban className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">Workaholic</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#B6C2CF]">{user?.name} ({user?.email})</span>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C333A] hover:bg-[#333B44] text-xs font-medium text-white transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="p-6 rounded-2xl bg-[#22272B] border border-[#38414A]">
          <h1 className="text-2xl font-bold mb-2">Welcome to Workaholic, {user?.name}!</h1>
          <p className="text-sm text-[#B6C2CF]">
            Milestone 1 Foundation & Auth successfully verified. Proceed to Milestone 2 to explore the Boards Dashboard and Templates.
          </p>
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
          <Route
            path="/boards"
            element={
              <ProtectedRoute>
                <TempDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/boards" replace />} />
          <Route path="*" element={<Navigate to="/boards" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
