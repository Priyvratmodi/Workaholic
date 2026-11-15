import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { apiRequest } from '../../api/client.js';
import { Icon } from '../ui/Icon.js';

export const ProfileSettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = name !== (user?.name || '') || avatarUrl !== (user?.avatarUrl || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await apiRequest<{ user: any }>('/api/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl: avatarUrl.trim() || null,
        }),
      });

      setUser(res.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-container-low rounded-2xl p-6 border border-border shadow-xs space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary tracking-tight">
          Profile and Visibility
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Manage your personal information and how other workspace members see you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        {error && (
          <div className="p-3 rounded-xl bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-xs flex items-center gap-2">
            <Icon name="error" size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-accent-success/10 border border-accent-success/30 text-accent-success text-xs flex items-center gap-2">
            <Icon name="check_circle" size={16} />
            <span>Profile saved successfully!</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-border text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
            placeholder="Your full name"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high/60 border border-border text-xs text-text-muted cursor-not-allowed select-none"
          />
          <p className="text-[11px] text-text-muted mt-1">
            Email address is tied to your Workaholic credentials and cannot be changed here.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Avatar Image URL
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-border text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
            placeholder="https://example.com/avatar.jpg"
          />
          <p className="text-[11px] text-text-muted mt-1">
            Provide a direct link to an avatar image (HTTPS).
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isDirty && !isSaving
                ? 'bg-primary text-primary-on-primary hover:brightness-110 cursor-pointer shadow-sm'
                : 'bg-surface-container border border-border text-text-muted cursor-not-allowed opacity-60'
            }`}
          >
            {isSaving ? (
              <>
                <Icon name="refresh" size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon name="save" size={16} />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
