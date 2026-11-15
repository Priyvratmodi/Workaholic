import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BoardBundle } from '@workaholic/shared';
import {
  fetchCardDetails,
  createCard,
  updateCard,
  deleteCard,
  createChecklist,
  deleteChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addComment,
  deleteComment,
  assignMember,
  unassignMember,
  assignLabel,
  unassignLabel,
  addAttachment,
  uploadAttachment,
  deleteAttachment,
} from '../../api/cards.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Icon } from '../ui/Icon.js';
import { COVER_COLORS, getLabelTextColor } from '../../utils/colors.js';
import { createBoardLabel, deleteBoardLabel } from '../../api/boards.js';

interface CardModalProps {
  cardId: string;
  board: BoardBundle;
  onClose: () => void;
}

// Imported COVER_COLORS

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CardModal: React.FC<CardModalProps> = ({ cardId, board, onClose }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isReadOnly = board.userRole === 'viewer';

  // State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [showDetails, setShowDetails] = useState(true);

  // Coordinated active dropdown (only one open at a time)
  type ActiveDropdown =
    | 'member'
    | 'label'
    | 'date'
    | 'cover'
    | 'cover_banner'
    | 'actions'
    | 'move'
    | 'header_actions'
    | null;

  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);

  const toggleDropdown = (name: ActiveDropdown) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const [isAddChecklistOpen, setIsAddChecklistOpen] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isAddAttachOpen, setIsAddAttachOpen] = useState(false);
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file || !card) return;
    setIsUploadingFile(true);
    setUploadError(null);
    try {
      await uploadAttachment(card.id, file);
      refreshCard();
      setIsAddAttachOpen(false);
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Custom Label Creation
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(COVER_COLORS[0].color);
  const [isSubmittingLabel, setIsSubmittingLabel] = useState(false);

  // Close active dropdown when clicking outside
  useEffect(() => {
    if (!activeDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-dropdown-container]')) {
        return;
      }
      setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Active adding item for checklist
  const [activeChecklistInput, setActiveChecklistInput] = useState<string | null>(null);
  const [checklistItemText, setChecklistItemText] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);

  // Fetch card details
  const { data, isLoading } = useQuery({
    queryKey: ['card-details', cardId],
    queryFn: () => fetchCardDetails(cardId),
  });

  const card = data?.card;
  const listTitle = data?.listTitle || '';

  useEffect(() => {
    if (card) {
      setTitleInput(card.title);
      setDescInput(card.description || '');
    }
  }, [card]);

  useEffect(() => {
    if (isEditingTitle) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [isEditingTitle]);

  // Handle escape key to close dropdown or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDropdown) {
          setActiveDropdown(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, activeDropdown]);

  // Helper to invalidate queries
  const refreshCard = () => {
    queryClient.invalidateQueries({ queryKey: ['card-details', cardId] });
    queryClient.invalidateQueries({ queryKey: ['board', board.id] });
  };

  // Mutations
  const updateCardMutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateCard>[1]) =>
      updateCard(cardId, updates),
    onSuccess: () => refreshCard(),
  });

  const deleteCardMutation = useMutation({
    mutationFn: () => deleteCard(cardId),
    onSuccess: () => {
      refreshCard();
      onClose();
    },
  });

  const handleMoveCard = (targetListId: string) => {
    if (targetListId === card?.listId) {
      setActiveDropdown(null);
      return;
    }
    updateCardMutation.mutate({ listId: targetListId });
    setActiveDropdown(null);
  };

  const handleCopyCard = async () => {
    if (!card) return;
    try {
      await createCard(card.listId, {
        title: `${card.title} (Copy)`,
        description: card.description,
      });
      refreshCard();
      setActiveDropdown(null);
    } catch (err) {
      console.error('Failed to copy card', err);
    }
  };

  const handleDeleteCard = () => {
    if (!card) return;
    setActiveDropdown(null);
    if (window.confirm(`Delete card "${card.title}"?`)) {
      deleteCardMutation.mutate();
    }
  };

  const handleCreateCustomLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelColor) return;
    try {
      setIsSubmittingLabel(true);
      const created = await createBoardLabel(board.id, {
        name: newLabelName.trim() || null,
        color: newLabelColor,
      });
      await assignLabel(cardId, created.id);
      queryClient.invalidateQueries({ queryKey: ['board', board.id] });
      refreshCard();
      setNewLabelName('');
      setIsCreatingLabel(false);
    } catch (err) {
      console.error('Failed to create custom label:', err);
    } finally {
      setIsSubmittingLabel(false);
    }
  };

  const handleDeleteBoardLabel = async (labelId: string, labelName: string | null) => {
    if (!window.confirm(`Delete label "${labelName || 'unnamed'}" from this board?`)) return;
    try {
      await deleteBoardLabel(board.id, labelId);
      queryClient.invalidateQueries({ queryKey: ['board', board.id] });
      refreshCard();
    } catch (err) {
      console.error('Failed to delete label:', err);
    }
  };

  if (isLoading || !card) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-menu border border-border rounded-2xl p-8 flex items-center gap-3 text-text-primary">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-text-muted">Loading card details...</span>
        </div>
      </div>
    );
  }

  // Due date status
  const getDueDateStatus = () => {
    if (!card.dueDate) return null;
    if (card.isComplete) {
      return {
        label: new Date(card.dueDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        colorClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        badge: 'Completed',
      };
    }
    const due = new Date(card.dueDate).getTime();
    const now = Date.now();
    const diffHours = (due - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return {
        label: new Date(card.dueDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        colorClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
        badge: 'Overdue',
      };
    }
    if (diffHours <= 24) {
      return {
        label: new Date(card.dueDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        colorClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        badge: 'Due soon',
      };
    }
    return {
      label: new Date(card.dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      colorClass: 'bg-surface-container text-text-secondary border-border',
      badge: null,
    };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[960px] bg-menu rounded-2xl shadow-2xl border border-border max-h-[92vh] flex flex-col overflow-hidden text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Strip (if set) */}
        {card.coverColor && (
          <div
            className="relative h-24 w-full shrink-0 flex items-end justify-end p-3 transition-colors"
            style={{ backgroundColor: card.coverColor }}
          >
            {!isReadOnly && (
              <div className="relative" data-dropdown-container>
                <button
                  type="button"
                  onClick={() => toggleDropdown('cover_banner')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md shadow-md transition-all"
                >
                  <Icon name="palette" size={16} />
                  <span>Change cover</span>
                </button>

                {activeDropdown === 'cover_banner' && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-menu border border-border rounded-xl shadow-xl p-3 z-30 flex flex-col gap-2">
                    <span className="text-xs font-semibold text-text-primary">Cover Color</span>
                    <div className="grid grid-cols-4 gap-2">
                      {COVER_COLORS.map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => {
                            updateCardMutation.mutate({ coverColor: c.color });
                            setActiveDropdown(null);
                          }}
                          className={`w-8 h-8 rounded-lg transition-transform hover:scale-105 flex items-center justify-center ${
                            card.coverColor === c.color ? 'ring-2 ring-primary ring-offset-2 ring-offset-menu' : ''
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        >
                          {card.coverColor === c.color && (
                            <Icon name="check" size={16} className="text-white font-bold" />
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateCardMutation.mutate({ coverColor: null });
                        setActiveDropdown(null);
                      }}
                      className="text-xs text-red-600 hover:underline text-left mt-1"
                    >
                      Remove cover
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-start justify-between gap-4 bg-menu sticky top-0 z-20">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon name="space_dashboard" size={24} className="text-primary mt-0.5" />
            <div className="flex-1 min-w-0">
              {isEditingTitle && !isReadOnly ? (
                <input
                  ref={titleRef}
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={() => {
                    setIsEditingTitle(false);
                    if (titleInput.trim() && titleInput.trim() !== card.title) {
                      updateCardMutation.mutate({ title: titleInput.trim() });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingTitle(false);
                      if (titleInput.trim() && titleInput.trim() !== card.title) {
                        updateCardMutation.mutate({ title: titleInput.trim() });
                      }
                    }
                    if (e.key === 'Escape') {
                      setTitleInput(card.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="w-full bg-canvas text-text-primary text-lg font-bold px-2 py-1 rounded-lg border border-primary focus:outline-none"
                />
              ) : (
                <h1
                  onClick={() => !isReadOnly && setIsEditingTitle(true)}
                  className={`text-lg font-bold text-text-primary leading-snug tracking-tight truncate ${
                    !isReadOnly ? 'cursor-pointer hover:text-primary' : ''
                  }`}
                  title={!isReadOnly ? 'Click to edit title' : undefined}
                >
                  {card.title}
                </h1>
              )}

              <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                <span>in list</span>
                <span className="font-semibold text-text-primary underline underline-offset-2">
                  {listTitle}
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() =>
                    updateCardMutation.mutate({ isComplete: !card.isComplete })
                  }
                  className={`flex items-center gap-1 font-medium transition-colors ${
                    card.isComplete
                      ? 'text-emerald-500 hover:underline'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon
                    name={card.isComplete ? 'check_circle' : 'radio_button_unchecked'}
                    size={16}
                  />
                  <span>{card.isComplete ? 'Completed' : 'Mark complete'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Header Actions & Close */}
          <div className="flex items-center gap-1">
            {!isReadOnly && (
              <div className="relative" data-dropdown-container>
                <button
                  type="button"
                  onClick={() => toggleDropdown('header_actions')}
                  title="Card actions"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    activeDropdown === 'header_actions'
                      ? 'bg-surface-container-high text-text-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-container-high'
                  }`}
                >
                  <Icon name="more_horiz" size={20} />
                </button>

                {activeDropdown === 'header_actions' && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-menu border border-border rounded-xl shadow-xl p-2 z-30 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1 px-1">
                      Move To List
                    </span>
                    <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                      {board.lists.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => handleMoveCard(l.id)}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                            l.id === card.listId
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-text-primary hover:bg-surface-container-high'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon name="view_kanban" size={14} className={l.id === card.listId ? 'text-primary' : 'text-text-muted'} />
                            <span className="truncate">{l.title}</span>
                          </div>
                          {l.id === card.listId && <Icon name="check" size={15} className="text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>

                    <div className="my-1 border-t border-border" />

                    <button
                      type="button"
                      onClick={handleCopyCard}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left text-text-primary hover:bg-surface-container-high transition-colors"
                    >
                      <Icon name="content_copy" size={15} className="text-text-muted" />
                      <span>Copy card</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteCard}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Icon name="delete" size={15} className="text-red-500" />
                      <span>Delete card</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-container-high transition-colors"
            >
              <Icon name="close" size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body: Two-Column Layout */}
        <div className="overflow-y-auto p-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
            {/* Left Column (Primary ~60%) */}
            <div className="md:col-span-7 flex flex-col gap-6">
              {/* Metadata Badges: Members, Labels, Due Date */}
              <div className="flex flex-col gap-3 pb-4 border-b border-border">
                <div className="flex flex-wrap gap-5 items-start text-xs">
                  {/* Members */}
                  {card.members.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Members
                      </span>
                      <div className="flex items-center -space-x-1.5">
                        {card.members.map((m) => (
                          <div
                            key={m.id}
                            className="w-7 h-7 rounded-full bg-surface-container-high text-text-primary text-[10px] font-bold flex items-center justify-center ring-2 ring-menu"
                            title={m.name}
                          >
                            {m.name.slice(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Labels */}
                  {card.labels.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Labels
                      </span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {card.labels.map((l) => (
                          <span
                            key={l.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white shadow-xs"
                            style={{ backgroundColor: l.color }}
                          >
                            {l.name || '•'}
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => unassignLabel(card.id, l.id).then(refreshCard)}
                                className="hover:opacity-75 ml-0.5"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Due Date */}
                  {dueDateStatus && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Due Date
                      </span>
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border shadow-xs ${dueDateStatus.colorClass}`}
                      >
                        <Icon name="calendar_today" size={14} />
                        <span>{dueDateStatus.label}</span>
                        {dueDateStatus.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider">
                            {dueDateStatus.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Pills */}
                {!isReadOnly && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {/* Assign Member Pill */}
                    <div className="relative" data-dropdown-container>
                      <button
                        type="button"
                        onClick={() => toggleDropdown('member')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          activeDropdown === 'member'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-surface-container-high hover:bg-surface-container text-text-secondary hover:text-text-primary border-border'
                        }`}
                      >
                        <Icon name="person_add" size={15} className="text-primary" />
                        <span>Assign</span>
                      </button>

                      {activeDropdown === 'member' && (
                        <div className="absolute left-0 mt-1 w-56 bg-menu border border-border rounded-xl shadow-xl p-2 z-30">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1 px-1">
                            Board Members
                          </span>
                          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                            {board.members.map((bm) => {
                              const isAssigned = card.members.some((m) => m.id === bm.userId);
                              return (
                                <button
                                  key={bm.id}
                                  type="button"
                                  onClick={async () => {
                                    if (isAssigned) {
                                      await unassignMember(card.id, bm.userId);
                                    } else {
                                      await assignMember(card.id, bm.userId);
                                    }
                                    refreshCard();
                                  }}
                                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left text-text-primary hover:bg-surface-container-high transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
                                      {bm.user.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="truncate">{bm.user.name}</span>
                                  </div>
                                  {isAssigned && (
                                    <Icon name="check" size={16} className="text-primary shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Labels Pill */}
                    <div className="relative" data-dropdown-container>
                      <button
                        type="button"
                        onClick={() => toggleDropdown('label')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          activeDropdown === 'label'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-surface-container-high hover:bg-surface-container text-text-secondary hover:text-text-primary border-border'
                        }`}
                      >
                        <Icon name="label" size={15} className="text-emerald-500" />
                        <span>Labels</span>
                      </button>

                      {activeDropdown === 'label' && (
                        <div className="absolute left-0 mt-1 w-64 bg-menu border border-border rounded-xl shadow-xl p-3 z-30 flex flex-col gap-2">
                          <div className="flex items-center justify-between pb-1 border-b border-border">
                            <span className="text-[11px] font-bold text-text-primary tracking-wide">
                              {isCreatingLabel ? 'Create Custom Label' : 'Labels'}
                            </span>
                            {isCreatingLabel && (
                              <button
                                type="button"
                                onClick={() => setIsCreatingLabel(false)}
                                className="text-text-muted hover:text-text-primary text-xs"
                              >
                                Back
                              </button>
                            )}
                          </div>

                          {!isCreatingLabel ? (
                            <>
                              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                                {board.labels.map((lbl) => {
                                  const isAssigned = card.labels.some((l) => l.id === lbl.id);
                                  return (
                                    <div
                                      key={lbl.id}
                                      className="flex items-center gap-1 group"
                                    >
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (isAssigned) {
                                            await unassignLabel(card.id, lbl.id);
                                          } else {
                                            await assignLabel(card.id, lbl.id);
                                          }
                                          refreshCard();
                                        }}
                                        className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left text-text-primary hover:bg-surface-container-high transition-colors"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span
                                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                                            style={{ backgroundColor: lbl.color }}
                                          />
                                          <span className="truncate font-medium">{lbl.name || 'Unnamed label'}</span>
                                        </div>
                                        {isAssigned && (
                                          <Icon name="check" size={16} className="text-primary shrink-0" />
                                        )}
                                      </button>
                                      {!isReadOnly && (
                                        <button
                                          type="button"
                                          title="Delete label from board"
                                          onClick={() => handleDeleteBoardLabel(lbl.id, lbl.name)}
                                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-text-muted hover:text-red-600 transition-opacity shrink-0"
                                        >
                                          <Icon name="close" size={14} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {!isReadOnly && (
                                <div className="pt-1 border-t border-border">
                                  <button
                                    type="button"
                                    onClick={() => setIsCreatingLabel(true)}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container text-text-primary text-xs font-semibold border border-border transition-colors"
                                  >
                                    <Icon name="add" size={15} className="text-primary" />
                                    <span>Create a new label</span>
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <form onSubmit={handleCreateCustomLabel} className="flex flex-col gap-2.5">
                              {/* Label Name Input */}
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                  Label Name
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Design, Frontend, Blocked..."
                                  value={newLabelName}
                                  onChange={(e) => setNewLabelName(e.target.value)}
                                  className="w-full bg-canvas text-text-primary text-xs px-2.5 py-1.5 rounded-lg border border-border focus:border-primary focus:outline-none"
                                  autoFocus
                                />
                              </div>

                              {/* Color Presets */}
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                  Select Color
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {COVER_COLORS.map((c) => (
                                    <button
                                      key={c.color}
                                      type="button"
                                      title={c.name}
                                      onClick={() => setNewLabelColor(c.color)}
                                      className={`h-7 rounded-md flex items-center justify-center transition-transform hover:scale-105 ${
                                        newLabelColor === c.color ? 'ring-2 ring-primary ring-offset-1' : ''
                                      }`}
                                      style={{ backgroundColor: c.color }}
                                    >
                                      {newLabelColor === c.color && (
                                        <Icon name="check" size={15} className="text-white font-bold" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Label Preview */}
                              <div className="flex flex-col gap-1 pt-0.5">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                  Preview
                                </span>
                                <div className="flex items-center">
                                  <span
                                    className="px-2.5 py-1 rounded-md text-xs font-semibold shadow-xs"
                                    style={{
                                      backgroundColor: newLabelColor,
                                      color: getLabelTextColor(newLabelColor),
                                    }}
                                  >
                                    {newLabelName.trim() || 'Label Preview'}
                                  </span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 pt-1 border-t border-border">
                                <button
                                  type="submit"
                                  disabled={isSubmittingLabel}
                                  className="flex-1 px-3 py-1.5 bg-primary hover:bg-primary-hover text-canvas text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-60"
                                >
                                  {isSubmittingLabel ? 'Creating...' : 'Create & Assign'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsCreatingLabel(false)}
                                  className="px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary rounded-lg"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Due Date Pill */}
                    <div className="relative" data-dropdown-container>
                      <button
                        type="button"
                        onClick={() => toggleDropdown('date')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          activeDropdown === 'date'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-surface-container-high hover:bg-surface-container text-text-secondary hover:text-text-primary border-border'
                        }`}
                      >
                        <Icon name="schedule" size={15} className="text-amber-500" />
                        <span>Dates</span>
                      </button>

                      {activeDropdown === 'date' && (
                        <div className="absolute left-0 mt-1 w-64 bg-menu border border-border rounded-xl shadow-xl p-3 z-30 flex flex-col gap-2">
                          <span className="text-xs font-semibold text-text-primary">Set Due Date</span>
                          <input
                            type="datetime-local"
                            defaultValue={
                              card.dueDate
                                ? new Date(card.dueDate).toISOString().slice(0, 16)
                                : ''
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              updateCardMutation.mutate({
                                dueDate: val ? new Date(val).toISOString() : null,
                              });
                              setActiveDropdown(null);
                            }}
                            className="bg-canvas text-text-primary text-xs px-2.5 py-1.5 rounded-lg border border-border focus:outline-none"
                          />
                          {card.dueDate && (
                            <button
                              type="button"
                              onClick={() => {
                                updateCardMutation.mutate({ dueDate: null });
                                setActiveDropdown(null);
                              }}
                              className="text-xs text-red-600 hover:underline text-left mt-1"
                            >
                              Remove date
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checklist Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        setIsAddChecklistOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-medium border border-border transition-colors"
                    >
                      <Icon name="checklist" size={15} className="text-indigo-400" />
                      <span>Checklist</span>
                    </button>

                    {/* Hidden native file input for direct computer upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Attachment Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-medium border border-border transition-colors"
                      title="Upload document or file from computer"
                    >
                      <Icon name="attach_file" size={15} className="text-text-muted" />
                      <span>{isUploadingFile ? 'Uploading...' : 'Attach'}</span>
                    </button>

                    {/* Cover Color Pill */}
                    <div className="relative" data-dropdown-container>
                      <button
                        type="button"
                        onClick={() => toggleDropdown('cover')}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          activeDropdown === 'cover'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-surface-container-high hover:bg-surface-container text-text-secondary hover:text-text-primary border-border'
                        }`}
                      >
                        <Icon name="palette" size={15} className="text-primary" />
                        <span>Cover</span>
                      </button>

                      {activeDropdown === 'cover' && (
                        <div className="absolute left-0 mt-1 w-60 bg-menu border border-border rounded-xl shadow-xl p-3 z-30 flex flex-col gap-2">
                          <span className="text-xs font-semibold text-text-primary">Cover Color</span>
                          <div className="grid grid-cols-4 gap-2">
                            {COVER_COLORS.map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => {
                                  updateCardMutation.mutate({ coverColor: c.color });
                                  setActiveDropdown(null);
                                }}
                                className={`w-8 h-8 rounded-lg transition-transform hover:scale-105 flex items-center justify-center ${
                                  card.coverColor === c.color ? 'ring-2 ring-primary ring-offset-2 ring-offset-menu' : ''
                                }`}
                                style={{ backgroundColor: c.color }}
                                title={c.name}
                              >
                                {card.coverColor === c.color && (
                                  <Icon name="check" size={16} className="text-white font-bold" />
                                )}
                              </button>
                            ))}
                          </div>
                          {card.coverColor && (
                            <button
                              type="button"
                              onClick={() => {
                                updateCardMutation.mutate({ coverColor: null });
                                setActiveDropdown(null);
                              }}
                              className="text-xs text-red-600 hover:underline text-left mt-1"
                            >
                              Remove cover
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="subject" size={20} className="text-text-muted" />
                    <h2 className="text-sm font-semibold text-text-primary">Description</h2>
                  </div>
                  {!isReadOnly && !isEditingDesc && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingDesc && !isReadOnly ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      rows={5}
                      placeholder="Add a more detailed description..."
                      className="w-full p-3 rounded-xl bg-canvas text-text-primary placeholder:text-text-muted text-xs border border-border focus:border-primary focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateCardMutation.mutate({ description: descInput.trim() });
                          setIsEditingDesc(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-canvas text-xs font-semibold transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDescInput(card.description || '');
                          setIsEditingDesc(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-surface-container-high transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !isReadOnly && setIsEditingDesc(true)}
                    className={`p-3 rounded-xl bg-canvas border border-border/70 text-xs text-text-secondary leading-relaxed min-h-[60px] whitespace-pre-wrap ${
                      !isReadOnly ? 'cursor-pointer hover:border-primary/60' : ''
                    }`}
                  >
                    {card.description || (
                      <span className="text-text-muted italic">
                        No description provided. Click to add details.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Add Checklist Modal / Inline Input */}
              {isAddChecklistOpen && (
                <div className="p-3 rounded-xl bg-canvas border border-border flex flex-col gap-2">
                  <span className="text-xs font-semibold text-text-primary">Add Checklist</span>
                  <input
                    type="text"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Checklist title..."
                    autoFocus
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-text-primary placeholder:text-text-muted text-xs border border-border focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (newChecklistTitle.trim()) {
                          await createChecklist(card.id, newChecklistTitle.trim());
                          setNewChecklistTitle('');
                          setIsAddChecklistOpen(false);
                          refreshCard();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-primary text-canvas text-xs font-semibold"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddChecklistOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Checklists Sections */}
              {card.checklists.map((ck) => {
                const total = ck.items.length;
                const done = ck.items.filter((i) => i.isDone).length;
                const percent = total === 0 ? 0 : Math.round((done / total) * 100);

                return (
                  <div key={ck.id} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="check_circle" size={20} className="text-text-muted" />
                        <h2 className="text-sm font-semibold text-text-primary">{ck.title}</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-text-muted">{percent}%</span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteChecklist(ck.id);
                              refreshCard();
                            }}
                            className="text-xs text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-canvas rounded-full h-2 overflow-hidden border border-border">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Checklist Items */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      {ck.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2.5 p-2 rounded-lg hover:bg-canvas transition-colors group"
                        >
                          <label className="flex items-start gap-2.5 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.isDone}
                              disabled={isReadOnly}
                              onChange={async (e) => {
                                await updateChecklistItem(item.id, {
                                  isDone: e.target.checked,
                                });
                                refreshCard();
                              }}
                              className="mt-0.5 rounded border-border text-primary focus:ring-0 w-4 h-4"
                            />
                            <span
                              className={`text-xs ${
                                item.isDone
                                  ? 'line-through text-text-muted'
                                  : 'text-text-primary'
                              }`}
                            >
                              {item.text}
                            </span>
                          </label>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteChecklistItem(item.id);
                                refreshCard();
                              }}
                              className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Icon name="delete" size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Item to Checklist */}
                    {!isReadOnly && (
                      <div>
                        {activeChecklistInput === ck.id ? (
                          <div className="flex flex-col gap-2 mt-1">
                            <input
                              type="text"
                              value={checklistItemText}
                              onChange={(e) => setChecklistItemText(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter' && checklistItemText.trim()) {
                                  await addChecklistItem(ck.id, checklistItemText.trim());
                                  setChecklistItemText('');
                                  refreshCard();
                                }
                                if (e.key === 'Escape') {
                                  setActiveChecklistInput(null);
                                  setChecklistItemText('');
                                }
                              }}
                              placeholder="Add an item..."
                              autoFocus
                              className="px-3 py-1.5 rounded-lg bg-canvas text-text-primary text-xs border border-border focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (checklistItemText.trim()) {
                                    await addChecklistItem(ck.id, checklistItemText.trim());
                                    setChecklistItemText('');
                                    refreshCard();
                                  }
                                }}
                                className="px-3 py-1 rounded-lg bg-primary text-canvas text-xs font-semibold"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveChecklistInput(null);
                                  setChecklistItemText('');
                                }}
                                className="px-2 py-1 rounded-lg text-xs text-text-muted hover:text-text-primary"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveChecklistInput(ck.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start mt-1"
                          >
                            <Icon name="add" size={16} />
                            <span>Add an item</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Attachments Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="attach_file" size={20} className="text-text-muted" />
                    <h2 className="text-sm font-semibold text-text-primary">Attachments</h2>
                    <span className="text-xs text-text-muted">({card.attachments.length})</span>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingFile}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-canvas text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
                      >
                        <Icon
                          name={isUploadingFile ? 'refresh' : 'cloud_upload'}
                          size={15}
                          className={isUploadingFile ? 'animate-spin' : ''}
                        />
                        <span>{isUploadingFile ? 'Uploading...' : 'Upload document'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddAttachOpen(!isAddAttachOpen)}
                        className="text-xs text-text-muted hover:text-text-primary px-2 py-1"
                      >
                        {isAddAttachOpen ? 'Close link' : 'Attach link'}
                      </button>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs flex items-center gap-2">
                    <Icon name="error" size={16} />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Drag and Drop Upload Zone */}
                {!isReadOnly && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      isDraggingFile
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/60 bg-surface-container/30 hover:bg-surface-container/60'
                    }`}
                  >
                    <Icon
                      name={isUploadingFile ? 'refresh' : 'cloud_upload'}
                      size={24}
                      className={`text-primary ${isUploadingFile ? 'animate-spin' : ''}`}
                    />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-text-primary">
                        {isUploadingFile
                          ? 'Uploading document from your computer...'
                          : 'Choose a document from your computer or drag & drop here'}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        PDFs, Office documents, text files, images, archives (up to 50MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* Attachments Grid */}
                {card.attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {card.attachments.map((att) => {
                      const isImg =
                        att.mimeType?.startsWith('image/') ||
                        /\.(png|jpe?g|gif|webp|svg)$/i.test(att.name);
                      const isPdf =
                        att.mimeType === 'application/pdf' ||
                        /\.pdf$/i.test(att.name);

                      return (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-canvas group hover:border-border/80 transition-all shadow-xs"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              isImg
                                ? 'bg-indigo-50 text-indigo-500'
                                : isPdf
                                ? 'bg-red-50 text-red-500'
                                : 'bg-surface-container-high text-primary'
                            }`}
                          >
                            <Icon name={isImg ? 'image' : 'description'} size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-text-primary truncate" title={att.name}>
                              {att.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted">
                              {att.size ? <span>{formatFileSize(att.size)}</span> : null}
                              {att.size && <span>•</span>}
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={att.name}
                                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                              >
                                <span>Download</span>
                                <Icon name="open_in_new" size={12} />
                              </a>
                              {!isReadOnly && (
                                <>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await deleteAttachment(att.id);
                                      refreshCard();
                                    }}
                                    className="text-red-500 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Attachment Form */}
                {isAddAttachOpen && !isReadOnly && (
                  <div className="p-3 rounded-xl bg-canvas border border-border flex flex-col gap-2">
                    <span className="text-xs font-semibold text-text-primary">Attach by URL</span>
                    <input
                      type="text"
                      value={attachName}
                      onChange={(e) => setAttachName(e.target.value)}
                      placeholder="Attachment name (e.g. Design Specs.fig)"
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-text-primary text-xs border border-border focus:outline-none"
                    />
                    <input
                      type="text"
                      value={attachUrl}
                      onChange={(e) => setAttachUrl(e.target.value)}
                      placeholder="Paste link URL (e.g. https://...)"
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-text-primary text-xs border border-border focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (attachName.trim() && attachUrl.trim()) {
                            await addAttachment(card.id, {
                              name: attachName.trim(),
                              url: attachUrl.trim(),
                            });
                            setAttachName('');
                            setAttachUrl('');
                            setIsAddAttachOpen(false);
                            refreshCard();
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary text-canvas text-xs font-semibold"
                      >
                        Attach
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddAttachOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Actions & Comments Stream (~40%) */}
            <div className="md:col-span-5 flex flex-col gap-4 border-l border-border pl-0 md:pl-6">
              {/* Card Actions (Move & Delete) */}
              {!isReadOnly && (
                <div className="flex flex-col gap-2 pb-3 border-b border-border">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Actions
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Move to another list custom dropdown */}
                    <div className="relative" data-dropdown-container>
                      <button
                        type="button"
                        onClick={() => toggleDropdown('move')}
                        className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          activeDropdown === 'move'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-surface-container-high hover:bg-surface-container text-text-primary border-border'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Icon name="drive_file_move" size={15} className="text-primary shrink-0" />
                          <span className="truncate">Move to: {listTitle || 'List'}</span>
                        </div>
                        <Icon name="expand_more" size={14} className="text-text-muted shrink-0" />
                      </button>

                      {activeDropdown === 'move' && (
                        <div className="absolute left-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-full min-w-[200px] bg-menu border border-border rounded-xl shadow-xl p-2 z-30 flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1 px-1">
                            Move To List
                          </span>
                          <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                            {board.lists.map((l) => (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => handleMoveCard(l.id)}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                                  l.id === card.listId
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-text-primary hover:bg-surface-container-high'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon name="view_kanban" size={14} className={l.id === card.listId ? 'text-primary' : 'text-text-muted'} />
                                  <span className="truncate">{l.title}</span>
                                </div>
                                {l.id === card.listId && <Icon name="check" size={15} className="text-primary shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delete card */}
                    <button
                      type="button"
                      onClick={handleDeleteCard}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium border border-red-200 transition-colors"
                    >
                      <Icon name="delete" size={16} />
                      <span>Delete card</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Activity & Comments Header with "Show details" toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="forum" size={20} className="text-text-muted" />
                  <h2 className="text-sm font-semibold text-text-primary">Activity & Comments</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
              </div>

              {/* Add Comment Box */}
              {!isReadOnly && (
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-on-primary shrink-0 font-bold text-xs flex items-center justify-center">
                    {user?.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-canvas border border-border rounded-xl p-2.5 flex flex-col gap-2">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Write a comment..."
                      rows={2}
                      className="w-full text-xs text-text-primary placeholder:text-text-muted bg-transparent border-none p-0 focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-end pt-1 border-t border-border/50">
                      <button
                        type="button"
                        disabled={!commentInput.trim()}
                        onClick={async () => {
                          if (commentInput.trim()) {
                            await addComment(card.id, commentInput.trim());
                            setCommentInput('');
                            refreshCard();
                          }
                        }}
                        className="px-3 py-1 bg-primary hover:bg-primary-hover text-primary-on-primary text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Combined Comments and Activities Stream */}
              <div className="flex flex-col gap-3 mt-1 overflow-y-auto max-h-[380px] pr-1">
                {/* Comments */}
                {card.comments?.map((cm) => (
                  <div key={cm.id} className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-full bg-surface-container-high text-text-primary text-[10px] font-bold shrink-0 flex items-center justify-center">
                      {cm.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-text-primary">
                          {cm.user.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted">
                            {new Date(cm.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {(cm.userId === user?.id || board.userRole === 'owner') && (
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteComment(cm.id);
                                refreshCard();
                              }}
                              className="text-text-muted hover:text-red-400"
                              title="Delete comment"
                            >
                              <Icon name="delete" size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 p-2 rounded-xl bg-canvas text-xs text-text-secondary border border-border/60 leading-relaxed whitespace-pre-wrap">
                        {cm.body}
                      </div>
                    </div>
                  </div>
                ))}

                {/* System Activities (shown only if showDetails is true) */}
                {showDetails &&
                  card.activities?.map((act) => {
                    const p = act.payload || {};
                    return (
                      <div
                        key={act.id}
                        className="flex gap-2 items-center text-[11px] text-text-muted px-1 py-0.5"
                      >
                        <Icon name="history" size={14} className="text-primary" />
                        <p className="truncate">
                          <span className="font-medium text-text-primary">{act.user.name}</span>{' '}
                          {act.type === 'card_moved'
                            ? `moved this card from ${p.fromList} to ${p.toList}`
                            : act.type === 'card_completed'
                            ? 'marked this card complete'
                            : act.type === 'card_uncompleted'
                            ? 'marked this card incomplete'
                            : act.type === 'comment_added'
                            ? 'commented on this card'
                            : 'updated this card'}
                        </p>
                        <span className="ml-auto text-[10px] shrink-0">
                          {new Date(act.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
