import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { Icon } from '../ui/Icon.js';
import { AccountMenu } from '../navigation/AccountMenu.js';

export const SettingsLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const navItems = [
    { label: 'Profile and visibility', path: '/settings/profile', icon: 'person' },
    { label: 'Activity', path: '/settings/activity', icon: 'history' },
    { label: 'Cards', path: '/settings/cards', icon: 'task_alt' },
    { label: 'Settings', path: '/settings', icon: 'settings', exact: true },
  ];

  return (
    <div className="min-h-screen bg-canvas text-text-secondary flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 z-40 bg-surface/85 backdrop-blur-md border-b border-border flex items-center justify-between px-6 select-none">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/boards')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
              <Icon name="space_dashboard" size={18} />
            </div>
            <span className="font-bold text-sm tracking-tight text-text-primary">
              Workaholic
            </span>
          </button>
          <span className="text-text-muted">/</span>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Preferences</span>
            <Icon name="chevron_right" size={14} />
            <span className="text-primary font-semibold">Account Settings</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/boards')}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
          >
            <Icon name="arrow_back" size={16} />
            <span className="hidden sm:inline">Back to boards</span>
          </button>
          <div className="h-4 w-px bg-border"></div>
          <AccountMenu />
        </div>
      </header>

      {/* Main Settings Area */}
      <div className="pt-14 flex-1 flex flex-col">
        {/* Banner Section */}
        <section className="bg-surface-container-low/60 border-b border-border px-8 py-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-brand-purple text-white flex items-center justify-center font-bold text-lg shadow-md shadow-black/20">
                  {initials}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent-success border-2 border-surface" title="Active now"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-text-primary tracking-tight">
                    {user?.name || 'Aarav Patel'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-text-muted text-[11px] font-semibold border border-border">
                    Workspace Member
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {user?.email || 'owner@workaholic.test'} • Manage your account preferences, appearance, and settings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface-container px-3.5 py-1.5 rounded-xl border border-border self-start md:self-auto shadow-xs text-xs">
              <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse"></span>
              <span className="text-text-secondary font-medium">Cloud sync active</span>
              <Icon name="cloud_done" size={16} className="text-accent-success ml-1" />
            </div>
          </div>
        </section>

        {/* 2-Column Layout */}
        <div className="max-w-6xl mx-auto w-full px-8 py-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
            {/* Left Sub-nav */}
            <aside className="sticky top-20 flex flex-col gap-2">
              <div className="bg-surface-container-low rounded-2xl p-2 border border-border shadow-sm flex flex-col gap-1">
                <span className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Account
                </span>
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-container'
                      }`
                    }
                  >
                    <Icon name={item.icon as any} size={18} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </aside>

            {/* Right Panel Outlet */}
            <main className="flex flex-col gap-6 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
