import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '../../stores/authStore.js';
import { Icon } from '../ui/Icon.js';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal.js';

interface AccountMenuProps {
  className?: string;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={`w-9 h-9 rounded-full bg-primary hover:bg-primary-hover text-primary-on-primary font-bold text-xs flex items-center justify-center ring-2 ring-primary/40 hover:ring-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer ${className}`}
            title={`Account menu (${user?.name || 'User'})`}
            aria-label="Open account menu"
          >
            {initials}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 w-[304px] rounded-xl bg-menu border border-border shadow-menu p-2 font-sans text-xs focus:outline-none animate-in fade-in zoom-in-95 duration-150 select-none"
            sideOffset={8}
            align="end"
            collisionPadding={16}
            avoidCollisions
          >
            {/* SECTION 1: ACCOUNT */}
            <div className="px-3 pt-2 pb-1 font-semibold uppercase tracking-wider text-[11px] text-text-muted">
              Account
            </div>

            {/* Profile User Row */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-menu-hover transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-brand-purple text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="flex flex-col min-w-0 truncate">
                <span className="font-semibold text-text-primary text-xs leading-tight truncate">
                  {user?.name || 'Aarav Patel'}
                </span>
                <span className="text-[11px] text-text-muted truncate mt-0.5">
                  {user?.email || 'owner@workaholic.test'}
                </span>
              </div>
            </div>

            {/* Switch accounts (Coming Soon) */}
            <DropdownMenu.Item
              disabled
              className="h-9 px-3 rounded-lg flex items-center justify-between text-text-muted opacity-60 cursor-not-allowed select-none outline-none"
            >
              <div className="flex items-center gap-3">
                <Icon name="swap_horiz" size={18} className="text-text-muted" />
                <span>Switch accounts</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container border border-border text-text-muted">
                Soon
              </span>
            </DropdownMenu.Item>

            {/* Manage account (Coming Soon) */}
            <DropdownMenu.Item
              disabled
              className="h-9 px-3 rounded-lg flex items-center justify-between text-text-muted opacity-60 cursor-not-allowed select-none outline-none"
            >
              <div className="flex items-center gap-3">
                <Icon name="manage_accounts" size={18} className="text-text-muted" />
                <span>Manage account</span>
              </div>
              <Icon name="open_in_new" size={14} className="text-text-muted" />
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-border my-1.5" />

            {/* SECTION 2: WORKAHOLIC */}
            <div className="px-3 pt-2 pb-1 font-semibold uppercase tracking-wider text-[11px] text-text-muted">
              Workaholic
            </div>

            <DropdownMenu.Item
              onSelect={() => navigate('/settings/profile')}
              className="h-9 px-3 rounded-lg flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-menu-hover focus:bg-menu-hover focus:text-text-primary transition-colors cursor-pointer outline-none"
            >
              <Icon name="person" size={18} className="text-text-muted" />
              <span>Profile and visibility</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={() => navigate('/settings/activity')}
              className="h-9 px-3 rounded-lg flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-menu-hover focus:bg-menu-hover focus:text-text-primary transition-colors cursor-pointer outline-none"
            >
              <Icon name="history" size={18} className="text-text-muted" />
              <span>Activity</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={() => navigate('/settings/cards')}
              className="h-9 px-3 rounded-lg flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-menu-hover focus:bg-menu-hover focus:text-text-primary transition-colors cursor-pointer outline-none"
            >
              <Icon name="task_alt" size={18} className="text-text-muted" />
              <span>Cards</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={() => navigate('/settings')}
              className="h-9 px-3 rounded-lg flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-menu-hover focus:bg-menu-hover focus:text-text-primary transition-colors cursor-pointer outline-none"
            >
              <Icon name="settings" size={18} className="text-text-muted" />
              <span>Settings</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-border my-1.5" />

            {/* SECTION 3: WORKSPACE ACTION */}
            <DropdownMenu.Item
              onSelect={() => navigate('/boards')}
              className="h-9 px-3 rounded-lg flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-menu-hover focus:bg-menu-hover focus:text-text-primary transition-colors cursor-pointer outline-none"
            >
              <Icon name="group_add" size={18} className="text-text-muted" />
              <span>Create Workspace</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-border my-1.5" />

            {/* SECTION 4: SUPPORT & UTILITIES */}
            <DropdownMenu.Item
              onSelect={() => alert('Workaholic Help & Documentation is available at /help')}
              className="h-9 px-3 rounded-lg flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-menu-hover focus:bg-menu-hover focus:text-text-primary transition-colors cursor-pointer outline-none"
            >
              <Icon name="help" size={18} className="text-text-muted" />
              <span>Help</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={() => setIsShortcutsOpen(true)}
              className="h-9 px-3 rounded-lg flex items-center justify-between text-text-secondary hover:text-text-primary hover:bg-menu-hover focus:bg-menu-hover focus:text-text-primary transition-colors cursor-pointer outline-none"
            >
              <div className="flex items-center gap-3">
                <Icon name="keyboard" size={18} className="text-text-muted" />
                <span>Keyboard shortcuts</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-surface-container border border-border text-[10px] font-mono text-text-muted">
                ?
              </span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-border my-1.5" />

            {/* SECTION 5: LOG OUT */}
            <DropdownMenu.Item
              onSelect={handleLogout}
              className="h-9 px-3 rounded-lg flex items-center gap-3 text-accent-danger hover:bg-menu-hover focus:bg-menu-hover transition-colors cursor-pointer outline-none"
            >
              <Icon name="logout" size={18} className="text-accent-danger" />
              <span className="font-medium">Log out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Global Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </>
  );
};
