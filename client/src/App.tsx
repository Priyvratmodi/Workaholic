import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthPage } from './components/auth/AuthPage.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { DashboardPage } from './components/dashboard/DashboardPage.js';
import { BoardPage } from './components/board/BoardPage.js';
import { SettingsLayout } from './components/settings/SettingsLayout.js';
import { SettingsPage } from './components/settings/SettingsPage.js';
import { ProfileSettingsPage } from './components/settings/ProfileSettingsPage.js';
import { ActivitySettingsPage } from './components/settings/ActivitySettingsPage.js';
import { CardsSettingsPage } from './components/settings/CardsSettingsPage.js';
import { KeyboardShortcutsModal } from './components/ui/KeyboardShortcutsModal.js';
import { useAuthStore } from './stores/authStore.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global listener: pressing '?' anywhere opens shortcuts modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:id"
            element={
              <ProtectedRoute>
                <BoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:id/cards/:cardId"
            element={
              <ProtectedRoute>
                <BoardPage />
              </ProtectedRoute>
            }
          />
          {/* Settings Routes */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SettingsPage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="activity" element={<ActivitySettingsPage />} />
            <Route path="cards" element={<CardsSettingsPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/boards" replace />} />
          <Route path="*" element={<Navigate to="/boards" replace />} />
        </Routes>

        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
