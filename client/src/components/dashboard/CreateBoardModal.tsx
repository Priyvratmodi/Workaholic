import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROJECT_MANAGEMENT_TEMPLATE } from '@workaholic/shared';
import { createBoard } from '../../api/boards.js';
import { BACKGROUND_OPTIONS } from '../../utils/backgrounds.js';

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
  const [background, setBackground] = useState<string>('gradient-1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTemplateId(PROJECT_MANAGEMENT_TEMPLATE.id);
      setBackground('gradient-1');
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
        templateId: templateId === 'blank' ? undefined : templateId,
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
        className="bg-[#22272B] border border-[#38414A] rounded-2xl max-w-xl w-full shadow-2xl p-6 flex flex-col gap-5 text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#38414A]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#579DFF]/20 text-[#579DFF] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Create a board</h3>
              <p className="text-xs text-[#8C9BAB]">Organize your workflow and track tasks</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#8C9BAB] hover:text-white hover:bg-[#2C333A] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-red-400 text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Board Title Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#B6C2CF] uppercase tracking-wider">
              Board Title <span className="text-red-400">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Product Roadmap, Marketing Hub..."
              className="px-3.5 py-2.5 rounded-xl bg-[#1D2125] text-white placeholder-[#8C9BAB] text-sm border border-[#38414A] focus:border-[#579DFF] focus:outline-none transition-all"
            />
          </div>

          {/* Cover Gradient Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#B6C2CF] uppercase tracking-wider">
              Board Theme
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {BACKGROUND_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBackground(bg.id)}
                  title={bg.name}
                  className={`w-9 h-9 rounded-xl ${bg.previewClass} transition-all duration-150 ${
                    background === bg.id
                      ? 'ring-2 ring-[#579DFF] ring-offset-2 ring-offset-[#22272B] scale-105'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#B6C2CF] uppercase tracking-wider">
              Workflow Structure
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTemplateId(PROJECT_MANAGEMENT_TEMPLATE.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                  isTemplateSelected
                    ? 'border-[#579DFF] bg-[#579DFF]/10 text-white ring-1 ring-[#579DFF]'
                    : 'border-[#38414A] bg-[#1D2125] hover:bg-[#2C333A] text-[#B6C2CF]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm text-white">
                    <span className="material-symbols-outlined text-[18px] text-[#579DFF]">
                      auto_stories
                    </span>
                    <span>Project Management</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#579DFF]/20 text-[#579DFF]">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-[#8C9BAB]">
                  Pre-configured with 6 standard lists and starter guidance cards.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTemplateId('blank')}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                  !isTemplateSelected
                    ? 'border-[#579DFF] bg-[#579DFF]/10 text-white ring-1 ring-[#579DFF]'
                    : 'border-[#38414A] bg-[#1D2125] hover:bg-[#2C333A] text-[#B6C2CF]'
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-sm text-white">
                  <span className="material-symbols-outlined text-[18px] text-[#8C9BAB]">
                    dashboard_customize
                  </span>
                  <span>Blank Board</span>
                </div>
                <p className="text-xs text-[#8C9BAB]">
                  Start fresh with an empty canvas and build your own lists.
                </p>
              </button>
            </div>
          </div>

          {/* About This Template Box */}
          {isTemplateSelected && (
            <div className="p-4 rounded-xl bg-[#1D2125] border border-[#38414A]/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#579DFF] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  About this template
                </span>
                <span className="text-[11px] text-[#8C9BAB] italic">
                  {PROJECT_MANAGEMENT_TEMPLATE.tagline}
                </span>
              </div>
              <p className="text-xs text-[#B6C2CF] leading-relaxed">
                {PROJECT_MANAGEMENT_TEMPLATE.description}
              </p>

              <div className="pt-2 border-t border-[#38414A]/50">
                <span className="text-[11px] font-semibold text-[#8C9BAB] uppercase tracking-wider block mb-2">
                  Includes 6 Workflow Lists
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_MANAGEMENT_TEMPLATE.lists.map((l, idx) => (
                    <div
                      key={l.title}
                      className="px-2 py-1 rounded-md bg-[#2C333A] border border-[#38414A] text-xs text-[#B6C2CF] flex items-center gap-1.5"
                    >
                      <span className="text-[11px] font-bold text-[#8C9BAB]">{idx + 1}.</span>
                      <span>{l.emoji}</span>
                      <span className="font-medium text-white">{l.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#38414A]/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#B6C2CF] hover:bg-[#2C333A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-[#579DFF] hover:bg-[#85B8FF] text-[#1D2125] font-semibold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-[#1D2125] border-t-transparent rounded-full animate-spin"></span>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">add</span>
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
