import React, { useState } from 'react';
import { useThemeStore } from '../../stores/themeStore.js';
import { apiRequest } from '../../api/client.js';
import { Icon } from '../ui/Icon.js';

export const SettingsPage: React.FC = () => {
  const { reduceMotion, setReduceMotion } = useThemeStore();

  const [compactCards, setCompactCards] = useState<boolean>(() => {
    return localStorage.getItem('workaholic-compact-cards') === 'true';
  });
  const [keyboardShortcuts, setKeyboardShortcuts] = useState<boolean>(true);
  const [emailMentions, setEmailMentions] = useState<boolean>(true);
  const [emailDueDates, setEmailDueDates] = useState<boolean>(true);

  const handleToggleReduceMotion = async () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    try {
      await apiRequest('/api/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          reduceMotion: next,
        }),
      });
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  };

  const handleToggleCompactCards = () => {
    const next = !compactCards;
    setCompactCards(next);
    localStorage.setItem('workaholic-compact-cards', String(next));
  };

  const handleResetDefaults = async () => {
    setReduceMotion(false);
    setCompactCards(false);
    localStorage.setItem('workaholic-compact-cards', 'false');
    setKeyboardShortcuts(true);
    setEmailMentions(true);
    setEmailDueDates(true);
    try {
      await apiRequest('/api/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          reduceMotion: false,
        }),
      });
    } catch (e) {
      console.error('Failed to reset preferences:', e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Panel Header */}
      <div className="bg-surface-container-low rounded-2xl p-6 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            Settings &amp; Preferences
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Manage how Workaholic looks, reacts, and delivers updates to your devices.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary text-xs font-semibold rounded-xl border border-border transition-colors self-start sm:self-auto"
        >
          <Icon name="restart_alt" size={16} />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* SECTION 1: Interface & Accessibility */}
      <div className="bg-surface-container-low rounded-2xl p-6 border border-border shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="tune" size={20} className="text-primary" />
            <h3 className="text-sm font-bold text-text-primary">Interface &amp; Accessibility</h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Customize animation speed, card density, and accessibility options.
          </p>
        </div>

        {/* Toggles */}
        <div className="space-y-4">
          {/* Toggle 1: Reduce motion */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-surface-container/60 transition-colors">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-text-primary">Reduce motion</p>
              <p className="text-[11px] text-text-muted">
                Minimize animations and drag effects across board lanes
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reduceMotion}
              onClick={handleToggleReduceMotion}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
                reduceMotion ? 'bg-primary' : 'bg-surface-container-high border border-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  reduceMotion ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              ></span>
            </button>
          </div>

          {/* Toggle 2: Compact cards */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-surface-container/60 transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-text-primary">Compact cards</p>
                <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  Productivity
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                Show more cards per screen by condensing padding and preview tags
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={compactCards}
              onClick={handleToggleCompactCards}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
                compactCards ? 'bg-primary' : 'bg-surface-container-high border border-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  compactCards ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              ></span>
            </button>
          </div>

          {/* Toggle 3: Keyboard shortcuts */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-surface-container/60 transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-text-primary">Keyboard shortcuts</p>
                <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
                  <span className="px-1 py-0.5 rounded bg-surface-container border border-border">⌘K</span>
                  <span>/</span>
                  <span className="px-1 py-0.5 rounded bg-surface-container border border-border">?</span>
                </div>
              </div>
              <p className="text-[11px] text-text-muted">
                Enable quick key navigation like ⌘K, ?, and single-key card actions
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={keyboardShortcuts}
              onClick={() => setKeyboardShortcuts(!keyboardShortcuts)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
                keyboardShortcuts ? 'bg-primary' : 'bg-surface-container-high border border-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  keyboardShortcuts ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              ></span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Notifications */}
      <div className="bg-surface-container-low rounded-2xl p-6 border border-border shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="notifications" size={20} className="text-primary" />
            <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Configure when Workaholic sends you email updates and alerts.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-surface-container/60 transition-colors">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-text-primary">Email on mentions</p>
              <p className="text-[11px] text-text-muted">
                Receive an email notification when someone @mentions you in a card comment or sprint activity log
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailMentions}
              onClick={() => setEmailMentions(!emailMentions)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
                emailMentions ? 'bg-primary' : 'bg-surface-container-high border border-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  emailMentions ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              ></span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-surface-container/60 transition-colors">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-text-primary">Email on due dates</p>
              <p className="text-[11px] text-text-muted">
                Get reminded 24 hours before a card assigned to you or watched by you is marked as due
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailDueDates}
              onClick={() => setEmailDueDates(!emailDueDates)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
                emailDueDates ? 'bg-primary' : 'bg-surface-container-high border border-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  emailDueDates ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              ></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
