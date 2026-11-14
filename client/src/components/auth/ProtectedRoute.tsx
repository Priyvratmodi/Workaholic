import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { Kanban } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitialized, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, checkAuth]);

  if (!isInitialized) {
    return (
      <div className="w-full min-h-screen bg-[#1D2125] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#579dff] flex items-center justify-center text-[#003468] animate-pulse">
            <Kanban className="w-7 h-7" />
          </div>
          <span className="text-sm text-[#B6C2CF] font-medium">Loading Workaholic...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
