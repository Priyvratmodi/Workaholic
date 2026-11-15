import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PROJECT_MANAGEMENT_TEMPLATE,
  TEMPLATE_PROJECT_MANAGEMENT_BACKGROUND,
} from '@workaholic/shared';
import { createBoard } from '../../api/boards.js';
import { BACKGROUND_OPTIONS } from '../../utils/backgrounds.js';
import { Icon } from '../ui/Icon.js';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState<string>(PROJECT_MANAGEMENT_TEMPLATE.id);
  const [background, setBackground] = useState<string>(TEMPLATE_PROJECT_MANAGEMENT_BACKGROUND);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTemplateId(PROJECT_MANAGEMENT_TEMPLATE.id);
      setBackground(TEMPLATE_PROJECT_MANAGEMENT_BACKGROUND);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a board title');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const newBoard = await createBoard({
        title: title.trim(),
        templateId: templateId,
        background,
      });

      onSuccess?.();
      onClose();
      navigate(`/boards/${newBoard.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create board');
    } finally {
      setIsLoading(false);
    }
  };

  const isTemplateSelected = templateId === PROJECT_MANAGEMENT_TEMPLATE.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-menu border border-border rounded-2xl max-w-xl w-full shadow-2xl p-6 flex flex-col gap-5 text-text-primary max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Icon name="space_dashboard" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Create a board</h3>
              <p className="text-xs text-text-muted">Organize your workflow and track tasks</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container flex items-center justify-center transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-sm flex items-center gap-2">
            <Icon name="error" size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Board Title Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Board Title <span className="text-accent-danger">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Product Roadmap, Marketing Hub..."
              className="px-3.5 py-2.5 rounded-xl bg-surface-container text-text-primary placeholder:text-text-muted text-sm border border-border focus:border-primary focus:outline-none transition-all"
            />
          </div>

          {/* Board Background Swatches */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Board Background
              </label>
              <span className="text-[11px] text-text-muted capitalize">
                Selected: {BACKGROUND_OPTIONS.find((b) => b.id === background)?.name || background}
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {BACKGROUND_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBackground(bg.id)}
                  title={`${bg.name} pastel`}
                  style={{ background: bg.cssGradient }}
                  className={`h-9 rounded-xl flex items-center justify-center transition-all duration-150 relative ${
                    background === bg.id
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-menu scale-105 shadow-sm'
                      : 'hover:scale-105 opacity-90 hover:opacity-100 border border-border/40'
                  }`}
                >
                  {background === bg.id && (
                    <Icon name="check" size={16} className="text-text-primary font-bold" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Workflow Structure
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTemplateId(PROJECT_MANAGEMENT_TEMPLATE.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                  isTemplateSelected
                    ? 'border-primary bg-primary/10 text-text-primary ring-1 ring-primary'
                    : 'border-border bg-surface-container hover:bg-surface-container-high text-text-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm text-text-primary">
                    <Icon name="auto_stories" size={18} className="text-primary" />
                    <span>Project Management</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Pre-configured with 6 standard lists and starter guidance cards.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTemplateId('blank')}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                  !isTemplateSelected
                    ? 'border-primary bg-primary/10 text-text-primary ring-1 ring-primary'
                    : 'border-border bg-surface-container hover:bg-surface-container-high text-text-secondary'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-sm text-text-primary">
                  <Icon name="dashboard_customize" size={18} className="text-text-muted" />
                  <span>Blank Board</span>
                </div>
                <p className="text-xs text-text-muted">
                  Start fresh with an empty canvas and build your own lists.
                </p>
              </button>
            </div>
          </div>

          {/* About This Template Box */}
          {isTemplateSelected && (
            <div className="p-4 rounded-xl bg-surface-container border border-border/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Icon name="info" size={16} />
                  About this template
                </span>
                <span className="text-[11px] text-text-muted italic">
                  {PROJECT_MANAGEMENT_TEMPLATE.tagline}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {PROJECT_MANAGEMENT_TEMPLATE.description}
              </p>

              <div className="pt-2 border-t border-border/50">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                  Includes 6 Workflow Lists
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_MANAGEMENT_TEMPLATE.lists.map((l, idx) => (
                    <div
                      key={l.title}
                      className="px-2 py-1 rounded-md bg-surface-container-high border border-border text-xs text-text-secondary flex items-center gap-1.5"
                    >
                      <span className="text-[11px] font-bold text-text-muted">{idx + 1}.</span>
                      <span>{l.emoji}</span>
                      <span className="font-medium text-text-primary">{l.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-on-primary font-semibold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-primary-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Icon name="add" size={18} />
                  <span>Create board</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
