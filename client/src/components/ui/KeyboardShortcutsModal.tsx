import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Icon } from './Icon.js';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  // Global listener for '?' key to open shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea, or contentEditable
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
        onClose(); // toggle or open handled by caller/listener
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const shortcuts = [
    { key: '?', description: 'Open keyboard shortcuts dialog' },
    { key: 'N', description: 'Create new board or new card' },
    { key: 'Esc', description: 'Close any active modal, menu or drawer' },
    { key: '⌘K / Ctrl+K', description: 'Focus search boards & tasks' },
    { key: 'Tab', description: 'Move focus forward across elements' },
    { key: 'Shift + Tab', description: 'Move focus backward across elements' },
    { key: 'Enter / Space', description: 'Activate focused button or menu item' },
    { key: '← / →', description: 'Navigate submenus or list columns' },
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-150" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl bg-menu border border-border p-6 shadow-2xl z-50 text-on-surface focus:outline-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="keyboard" size={20} />
              </div>
              <Dialog.Title className="text-base font-semibold text-text-primary">
                Keyboard Shortcuts
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container flex items-center justify-center transition-colors"
                aria-label="Close shortcuts"
              >
                <Icon name="close" size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="py-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
            {shortcuts.map((sc) => (
              <div
                key={sc.key}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container/60 hover:bg-surface-container transition-colors"
              >
                <span className="text-xs text-text-secondary">{sc.description}</span>
                <kbd className="px-2 py-1 rounded-md bg-surface-container-high border border-border text-[11px] font-mono font-semibold text-text-primary shadow-xs">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-surface-container border border-border text-[10px] font-mono">Esc</kbd> anytime to exit</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-primary text-primary-on-primary font-semibold text-xs hover:brightness-110 transition-all shadow-sm"
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
