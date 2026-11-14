import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { apiRequest, ApiError } from '../../api/client.js';
import { UserSummary } from '@workaholic/shared';
import {
  Kanban,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User as UserIcon,
  CheckCircle2,
  Paperclip,
  MessageSquare,
  Clock,
  Sparkles,
  ShieldCheck,
  Star,
} from 'lucide-react';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({
  initialMode = 'login',
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((s) => s.setUser);

  const from = (location.state as any)?.from?.pathname || '/boards';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password };
      const res = await apiRequest<{ user: UserSummary }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setUser(res.user);
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
    <div className="w-full min-h-screen bg-[#101418] text-[#e0e3e8] flex flex-col font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 w-full min-h-screen">
        {/* LEFT PANEL: Authentication Form */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-[#0b0f12] border-r border-[#262a2e]">
          {/* Top Brand Header */}
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#579dff] flex items-center justify-center text-[#003468] shadow-md">
                <Kanban className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-bold text-white tracking-tight leading-none">
                  Workaholic
                </span>
                <span className="font-mono text-[11px] text-[#8b919e] tracking-wider uppercase mt-1">
                  Workspace OS
                </span>
              </div>
            </div>
          </div>

          {/* Main Login Form Area */}
          <div className="w-full max-w-md mx-auto my-auto py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="text-sm text-[#c1c6d4] mt-2">
                {isLogin
                  ? 'Enter your credentials to access your workspaces and boards.'
                  : 'Start orchestrating projects with precision and fluidity.'}
              </p>
            </div>

            {/* Quick Demo Logins Banner */}
            <div className="mb-6 p-3 rounded-xl bg-[#181c20] border border-[#262a2e]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#a8c8ff] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick Demo Logins
                </span>
                <span className="text-[10px] text-[#8b919e]">Password: password123</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('owner@workaholic.test')}
                  className="py-1.5 px-2 rounded-lg bg-[#262a2e] hover:bg-[#313539] text-xs font-medium text-white transition flex flex-col items-center"
                >
                  <span className="font-semibold text-[#579dff]">Owner</span>
                  <span className="text-[10px] text-[#8b919e]">Aarav</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('member@workaholic.test')}
                  className="py-1.5 px-2 rounded-lg bg-[#262a2e] hover:bg-[#313539] text-xs font-medium text-white transition flex flex-col items-center"
                >
                  <span className="font-semibold text-[#4BCE97]">Member</span>
                  <span className="text-[10px] text-[#8b919e]">Jessica</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('viewer@workaholic.test')}
                  className="py-1.5 px-2 rounded-lg bg-[#262a2e] hover:bg-[#313539] text-xs font-medium text-white transition flex flex-col items-center"
                >
                  <span className="font-semibold text-[#F5CD47]">Viewer</span>
                  <span className="text-[10px] text-[#8b919e]">Sophia</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center my-5">
              <div className="flex-grow h-px bg-[#262a2e]"></div>
              <span className="flex-shrink mx-3 text-xs text-[#8b919e] uppercase tracking-wider font-mono">
                or continue with credentials
              </span>
              <div className="flex-grow h-px bg-[#262a2e]"></div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs">
                {error}
              </div>
            )}

            {/* Form Elements */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-[#e0e3e8] mb-1.5">
                    Full name
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-3.5 text-[#8b919e] w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181c20] text-white placeholder:text-[#8b919e] text-sm border border-[#262a2e] focus:border-[#579dff] focus:outline-none focus:ring-1 focus:ring-[#579dff] transition"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-xs font-medium text-[#e0e3e8] mb-1.5">
                  Email address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 text-[#8b919e] w-4 h-4 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181c20] text-white placeholder:text-[#8b919e] text-sm border border-[#262a2e] focus:border-[#579dff] focus:outline-none focus:ring-1 focus:ring-[#579dff] transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#e0e3e8]">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => alert('For demo, use default password: password123')}
                      className="text-xs text-[#579dff] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 text-[#8b919e] w-4 h-4 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#181c20] text-white placeholder:text-[#8b919e] text-sm border border-[#262a2e] focus:border-[#579dff] focus:outline-none focus:ring-1 focus:ring-[#579dff] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 text-[#8b919e] hover:text-white transition p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              {isLogin && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded text-[#579dff] accent-[#579dff] cursor-pointer"
                    />
                    <span className="text-xs text-[#c1c6d4]">Remember device for 30 days</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#579dff] hover:bg-[#85b8ff] text-[#003062] font-semibold text-sm transition-all duration-200 shadow-md disabled:opacity-50 active:scale-[0.99]"
                >
                  <span>{loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Switch Mode Callout */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[#c1c6d4]">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="font-semibold text-[#579dff] hover:underline ml-1.5"
                >
                  {isLogin ? 'Create account' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Legal / Meta Bottom */}
          <div className="w-full max-w-md mx-auto flex items-center justify-between pt-6 text-xs text-[#8b919e]">
            <span>© 2025 Workaholic Inc.</span>
            <div className="flex items-center gap-3">
              <span className="hover:text-white cursor-pointer">Privacy</span>
              <span>·</span>
              <span className="hover:text-white cursor-pointer">Terms</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Brand Showcase & Visual Canvas (Matching taskflow_login/code.html) */}
        <div className="lg:col-span-6 xl:col-span-7 relative flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16 overflow-hidden bg-gradient-to-br from-[#1c2024] via-[#101418] to-[#181c20] text-white min-h-[500px]">
          {/* Ambient Backdrops & Radial Gradients */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#579dff]/15 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-[#9F8FEF]/10 blur-3xl pointer-events-none"></div>

          {/* Top Row Badge Status */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#4BCE97] animate-pulse"></span>
              <span className="font-mono text-xs tracking-wider uppercase text-white/90">
                Sprint 24 • Live Velocity 99.4%
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-white/70">
              <ShieldCheck className="w-4 h-4 text-[#4BCE97]" />
              <span>SOC2 & ISO 27001 Certified</span>
            </div>
          </div>

          {/* Center Artboard: Floating Glassmorphism Kanban Cards */}
          <div className="relative z-10 w-full max-w-lg mx-auto my-auto py-12 flex flex-col items-center">
            <div className="relative w-full h-[360px] flex items-center justify-center">
              {/* Backing Decorative Ambient Glow */}
              <div className="absolute w-72 h-72 rounded-full bg-[#579dff]/10 blur-2xl"></div>

              {/* CARD 1 (Top-Left Floating Layer) */}
              <div className="absolute -left-2 sm:left-4 top-2 w-72 sm:w-80 rounded-2xl p-4 bg-[#2C333A]/85 backdrop-blur-xl border border-[#38414A] shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs text-[#a8c8ff]">TFL-1082</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#579dff]/20 text-[#a8c8ff] text-[11px] font-medium">
                    Design System
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-3">
                  Launch Design System Tokens v2.0
                </p>
                <div className="flex items-center justify-between text-xs text-[#B6C2CF]">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#F5CD47]" />
                    <span>Tomorrow</span>
                  </div>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-[#579dff] text-[#003062] flex items-center justify-center font-bold text-[10px] ring-2 ring-[#2C333A]">
                      AP
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#4BCE97] text-[#003824] flex items-center justify-center font-bold text-[10px] ring-2 ring-[#2C333A]">
                      JD
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2 (Center Hero Focus Card) */}
              <div className="absolute z-20 w-80 sm:w-96 rounded-2xl p-5 bg-[#22272B]/95 backdrop-blur-2xl border border-[#579dff]/40 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#a8c8ff] font-bold">TFL-0941</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4BCE97]"></span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#4BCE97]/20 text-[#4BCE97] text-[11px] font-semibold tracking-wide uppercase">
                    In Progress
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  Q4 Strategic Roadmap & Engineering OKRs
                </h3>
                <p className="text-xs text-[#B6C2CF] mb-4">
                  Unifying cross-platform task pipelines with instant collaborative sync engines.
                </p>

                {/* Progress Bar Tracker */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#B6C2CF]">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4BCE97]" />
                      <span>4 of 5 milestones</span>
                    </span>
                    <span className="font-semibold text-[#4BCE97]">80%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#38414A] overflow-hidden">
                    <div className="h-full bg-[#4BCE97] rounded-full w-4/5"></div>
                  </div>
                </div>

                {/* Bottom Cluster */}
                <div className="flex items-center justify-between pt-2 border-t border-[#38414A]/50">
                  <div className="flex items-center gap-3 text-xs text-[#8C9BAB]">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5" /> 14
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                      <Paperclip className="w-3.5 h-3.5" /> 6
                    </span>
                  </div>
                  <div className="flex items-center -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-[#579dff] text-[#003062] flex items-center justify-center font-bold text-[10px] ring-2 ring-[#22272B]">
                      AP
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#cabeff] text-[#311e7a] flex items-center justify-center font-bold text-[10px] ring-2 ring-[#22272B]">
                      SL
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#313539] text-[#e0e3e8] font-mono text-[10px] flex items-center justify-center font-bold ring-2 ring-[#22272B]">
                      +3
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3 (Bottom-Right Accent Layer) */}
              <div className="absolute -right-2 sm:right-4 bottom-2 w-72 sm:w-80 rounded-2xl p-4 bg-[#2C333A]/85 backdrop-blur-xl border border-[#38414A] shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-[#a8c8ff]">TFL-1104</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F87168]/20 text-[#F87168] text-[11px] font-semibold">
                    Priority P1
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-2">
                  Mobile Native Micro-Interactions
                </p>
                <div className="flex items-center justify-between text-xs text-[#B6C2CF] font-mono text-[11px]">
                  <span>Review Pending</span>
                  <span className="px-2 py-0.5 rounded bg-[#38414A] text-white">Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Narrative & Social Proof */}
          <div className="relative z-10 pt-4 max-w-lg">
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              Orchestrate work with fluid clarity.
            </h2>
            <p className="text-sm text-[#B6C2CF] mb-4">
              The modern visual platform engineering, product, and design teams trust to ship
              exceptional digital products with radical speed.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-[#F5CD47]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                <span className="text-xs font-semibold text-white ml-1.5">4.9 / 5</span>
              </div>
              <div className="h-3 w-px bg-white/20"></div>
              <div className="text-xs text-[#B6C2CF]">
                Trusted by <span className="font-bold text-white">10,000+</span> teams worldwide
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
