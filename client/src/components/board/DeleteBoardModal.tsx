import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon.js';

interface DeleteBoardModalProps {
  isOpen: boolean;
  boardTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteBoardModal: React.FC<DeleteBoardModalProps> = ({
  isOpen,
  boardTitle,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete board');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div
        className="bg-menu border border-border rounded-2xl max-w-md w-full shadow-2xl p-6 flex flex-col gap-5 text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-danger/15 text-accent-danger flex items-center justify-center shrink-0">
              <Icon name="delete" size={22} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Delete Board</h3>
              <p className="text-xs text-text-muted">Permanent workspace action</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close"
            className="w-8 h-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Warning Body */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-primary">
            Are you sure you want to delete <strong className="text-text-primary font-semibold">"{boardTitle}"</strong>?
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            This action cannot be undone. All lists, cards, checklists, attachments, and activity history associated with this board will be permanently deleted.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-xs flex items-center gap-2">
            <Icon name="error" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-container border border-border transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-danger hover:bg-accent-danger-hover text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Icon name="refresh" size={16} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Icon name="delete" size={16} />
                <span>Delete Board</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
