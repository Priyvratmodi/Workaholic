import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { apiRequest, ApiError } from '../../api/client.js';
import { UserSummary } from '@workaholic/shared';
import { Icon } from '../ui/Icon.js';
import { Avatar } from '../ui/Avatar.js';
import { GoogleLogo } from '../../utils/googleLogo.js';

export interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);

  const from = (location.state as any)?.from?.pathname || '/boards';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiRequest<{ user: UserSummary }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setUser(res.user);
      } else {
        const res = await apiRequest<{ user: UserSummary }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        setUser(res.user);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest<{ user: UserSummary }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoEmail, password: 'password123' }),
      });
      setUser(res.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-canvas text-text-primary flex flex-col font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 w-full min-h-screen">
        {/* LEFT PANEL: Authentication Form */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-surface-container-lowest border-r border-border">
          {/* Top Brand Header */}
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-on-primary flex items-center justify-center font-bold shadow-md">
                <Icon name="view_kanban" size={24} filled />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-text-primary tracking-tight leading-none">
                  Workaholic
                </span>
                <span className="text-[11px] font-mono text-text-muted tracking-wider uppercase mt-0.5">
                  Workspace OS
                </span>
              </div>
            </div>
          </div>

          {/* Main Login Form Area */}
          <div className="w-full max-w-md mx-auto my-auto py-6">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="text-xs sm:text-sm text-text-muted mt-1.5">
                {isLogin
                  ? 'Enter your credentials to access your workspaces and boards.'
                  : 'Start orchestrating projects with precision and fluidity.'}
              </p>
            </div>

            {/* Quick Demo Logins Banner */}
            <div className="mb-5 p-3 rounded-xl bg-surface-container-low border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Icon name="auto_awesome" size={14} />
                  Quick Demo Logins
                </span>
                <span className="text-[10px] text-text-muted font-mono">Password: password123</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('owner@workaholic.test')}
                  className="py-2 px-2.5 rounded-xl border border-border bg-surface-container hover:bg-surface-container-high text-xs font-medium text-text-primary transition flex flex-col items-center gap-0.5 shadow-2xs hover:border-primary/50"
                >
                  <span className="font-semibold text-primary">Owner</span>
                  <span className="text-[10px] text-text-muted">Aarav</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('member@workaholic.test')}
                  className="py-2 px-2.5 rounded-xl border border-border bg-surface-container hover:bg-surface-container-high text-xs font-medium text-text-primary transition flex flex-col items-center gap-0.5 shadow-2xs hover:border-primary/50"
                >
                  <span className="font-semibold text-text-primary">Member</span>
                  <span className="text-[10px] text-text-muted">Jessica</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('viewer@workaholic.test')}
                  className="py-2 px-2.5 rounded-xl border border-border bg-surface-container hover:bg-surface-container-high text-xs font-medium text-text-primary transition flex flex-col items-center gap-0.5 shadow-2xs hover:border-primary/50"
                >
                  <span className="font-semibold text-text-primary">Viewer</span>
                  <span className="text-[10px] text-text-muted">Sophia</span>
                </button>
              </div>
            </div>

            {/* Social SSO Button */}
            <button
              type="button"
              onClick={() => handleDemoLogin('owner@workaholic.test')}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-text-primary font-medium text-xs sm:text-sm transition duration-200 border border-border shadow-2xs"
            >
              <GoogleLogo className="w-4 h-4" />
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center my-4">
              <div className="flex-grow h-px bg-border"></div>
              <span className="flex-shrink mx-3 text-[11px] text-text-muted uppercase tracking-wider font-mono">
                or continue with email
              </span>
              <div className="flex-grow h-px bg-border"></div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-xs flex items-center gap-2">
                <Icon name="error" size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Form Elements */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Full name
                  </label>
                  <div className="relative flex items-center">
                    <Icon name="person" size={18} className="absolute left-3.5 text-text-muted pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low text-text-primary placeholder:text-text-muted text-xs sm:text-sm border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Email address
                </label>
                <div className="relative flex items-center">
                  <Icon name="mail" size={18} className="absolute left-3.5 text-text-muted pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low text-text-primary placeholder:text-text-muted text-xs sm:text-sm border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-text-primary">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => alert('For demo, use default password: password123')}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Icon name="lock" size={18} className="absolute left-3.5 text-text-muted pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-surface-container-low text-text-primary placeholder:text-text-muted text-xs sm:text-sm border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 text-text-muted hover:text-text-primary transition p-1"
                  >
                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              {isLogin && (
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                    />
                    <span className="text-xs text-text-muted">Remember this device for 30 days</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-on-primary font-semibold text-sm transition-all duration-200 shadow-md shadow-primary/20 disabled:opacity-50 active:scale-[0.99]"
                >
                  <span>{loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}</span>
                  <Icon name="arrow_forward" size={18} />
                </button>
              </div>
            </form>

            {/* Switch Mode Callout */}
            <div className="mt-5 text-center">
              <p className="text-xs sm:text-sm text-text-muted">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="font-semibold text-primary hover:underline ml-1.5"
                >
                  {isLogin ? 'Create account' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Legal / Meta Bottom */}
          <div className="w-full max-w-md mx-auto flex items-center justify-between pt-4 text-xs text-text-muted">
            <span>© 2025 Workaholic Inc.</span>
            <div className="flex items-center gap-3">
              <span className="hover:text-text-primary cursor-pointer transition">Privacy Policy</span>
              <span>·</span>
              <span className="hover:text-text-primary cursor-pointer transition">Terms of Service</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Brand Showcase & Visual Canvas (Matches design/taskflow_login/code.html) */}
        <div className="lg:col-span-6 xl:col-span-7 relative flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16 overflow-hidden bg-auth-brand-gradient text-white min-h-[600px] lg:min-h-auto">
          {/* Ambient Backdrops & Radial Gradients */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-400 opacity-20 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-amber-400 opacity-15 blur-3xl pointer-events-none"></div>
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>

          {/* Top Row Badge Status */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              <span className="font-mono text-xs tracking-wider uppercase text-white font-medium">
                Sprint 24 • Live Velocity 99.4%
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-white/85">
              <Icon name="lock" size={14} className="text-white/80" />
              <span>SOC2 & ISO 27001 Certified</span>
            </div>
          </div>

          {/* Center Artboard: Floating Glassmorphism Kanban Cards */}
          <div className="relative z-10 w-full max-w-xl mx-auto my-auto py-10 flex flex-col items-center">
            <div className="relative w-full h-[360px] flex items-center justify-center">
              {/* Backing Decorative Ambient Glow */}
              <div className="absolute w-72 h-72 rounded-full bg-indigo-300/20 blur-2xl"></div>

              {/* CARD 1 (Top-Left Floating Layer) */}
              <div className="absolute -left-2 sm:left-4 top-4 w-72 sm:w-80 rounded-2xl p-4 bg-white/15 backdrop-blur-xl border border-white/20 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300 text-white">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs text-indigo-100 font-bold">TFL-1082</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold">
                    Design System
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-3">Launch Design System Tokens v2.0</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/85 font-mono text-xs">
                    <Icon name="schedule" size={14} />
                    <span>Tomorrow</span>
                  </div>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <Avatar name="Alex Rivera" size={24} className="ring-2 ring-white/40" />
                    <Avatar name="Sarah Chen" size={24} className="ring-2 ring-white/40" />
                  </div>
                </div>
              </div>

              {/* CARD 2 (Center Hero Focus Card) */}
              <div className="absolute z-20 w-80 sm:w-96 rounded-2xl p-5 bg-white/25 backdrop-blur-2xl border border-white/30 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-100 font-bold">TFL-0941</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-semibold tracking-wide">
                    IN PROGRESS
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  Q4 Strategic Roadmap & Engineering OKRs
                </h3>
                <p className="text-xs text-white/80 mb-3.5">
                  Unifying cross-platform task pipelines with instant collaborative sync engines.
                </p>

                {/* Progress Bar Tracker */}
                <div className="space-y-1.5 mb-3.5">
                  <div className="flex items-center justify-between font-mono text-xs text-white/90">
                    <span className="flex items-center gap-1">
                      <Icon name="checklist" size={14} />
                      <span>4 of 5 milestones</span>
                    </span>
                    <span className="font-semibold text-emerald-200">80%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full bg-emerald-300 rounded-full w-4/5"></div>
                  </div>
                </div>

                {/* Card Bottom Cluster */}
                <div className="flex items-center justify-between pt-2 border-t border-white/15">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-white/85 font-mono text-xs">
                      <Icon name="chat_bubble" size={13} /> 14
                    </span>
                    <span className="inline-flex items-center gap-1 text-white/85 font-mono text-xs">
                      <Icon name="attach_file" size={13} /> 6
                    </span>
                  </div>
                  <div className="flex items-center -space-x-1.5">
                    <Avatar name="Marcus Vance" size={28} className="ring-2 ring-white/40" />
                    <Avatar name="Elena Rostova" size={28} className="ring-2 ring-white/40" />
                    <div className="w-7 h-7 rounded-full bg-white/20 text-white font-mono text-xs flex items-center justify-center font-bold ring-2 ring-white/40">
                      +3
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3 (Bottom-Right Accent Layer) */}
              <div className="absolute -right-2 sm:right-6 bottom-2 w-72 sm:w-80 rounded-2xl p-4 bg-white/15 backdrop-blur-xl border border-white/20 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-indigo-100 font-bold">TFL-1104</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-[11px] font-semibold">
                    Priority P1
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-2">
                  Mobile Native Micro-Interactions
                </p>
                <div className="flex items-center justify-between text-white/85 font-mono text-xs">
                  <span className="flex items-center gap-1">
                    <Icon name="notifications" size={14} />
                    <span>Review Pending</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/20 text-white font-semibold">Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Narrative & Social Proof */}
          <div className="relative z-10 pt-4 max-w-lg">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Orchestrate work with fluid clarity.
            </h2>
            <p className="text-xs sm:text-sm text-white/85 mb-4">
              The modern visual platform engineering, product, and design teams trust to ship
              exceptional digital products with radical speed.
            </p>
            {/* Social Proof Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-accent-star">
                <Icon name="star" filled size={16} />
                <Icon name="star" filled size={16} />
                <Icon name="star" filled size={16} />
                <Icon name="star" filled size={16} />
                <Icon name="star" filled size={16} />
                <span className="text-xs font-semibold text-white ml-1.5">4.9 / 5</span>
              </div>
              <div className="h-3 w-px bg-white/30"></div>
              <div className="text-xs text-white/90 font-medium">
                Trusted by <span className="font-bold text-white">10,000+</span> teams worldwide
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
