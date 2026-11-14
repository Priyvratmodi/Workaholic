import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BoardBundle } from '@workaholic/shared';
import {
  fetchCardDetails,
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
  deleteAttachment,
} from '../../api/cards.js';
import { useAuthStore } from '../../stores/authStore.js';

interface CardModalProps {
  cardId: string;
  board: BoardBundle;
  onClose: () => void;
}

const COVER_COLORS = [
  { name: 'Indigo Blue', color: '#4241BC' },
  { name: 'Sky Blue', color: '#2563EB' },
  { name: 'Teal Green', color: '#0D9488' },
  { name: 'Emerald', color: '#16A34A' },
  { name: 'Amber Orange', color: '#D97706' },
  { name: 'Rose Red', color: '#E11D48' },
  { name: 'Purple', color: '#9333EA' },
  { name: 'Slate Obsidian', color: '#475569' },
];

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

  // Popover menus
  const [isLabelMenuOpen, setIsLabelMenuOpen] = useState(false);
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isAddChecklistOpen, setIsAddChecklistOpen] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isAddAttachOpen, setIsAddAttachOpen] = useState(false);
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');

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

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  if (isLoading || !card) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-[#22272B] border border-[#38414A] rounded-2xl p-8 flex items-center gap-3 text-white">
          <div className="w-6 h-6 border-2 border-[#579DFF] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-[#8C9BAB]">Loading card details...</span>
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
        colorClass: 'bg-[#4BCE97]/20 text-[#4BCE97] border-[#4BCE97]/40',
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
        colorClass: 'bg-[#F87168]/20 text-[#F87168] border-[#F87168]/40',
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
        colorClass: 'bg-[#F5CD47]/20 text-[#F5CD47] border-[#F5CD47]/40',
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
      colorClass: 'bg-[#2C333A] text-[#B6C2CF] border-[#38414A]',
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
        className="w-full max-w-[960px] bg-[#22272B] rounded-2xl shadow-2xl border border-[#38414A] max-h-[92vh] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Strip (if set) */}
        {card.coverColor && (
          <div
            className="relative h-24 w-full shrink-0 flex items-end justify-end p-3 transition-colors"
            style={{ backgroundColor: card.coverColor }}
          >
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsCoverMenuOpen(!isCoverMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">palette</span>
                <span>Change cover</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#38414A] flex items-start justify-between gap-4 bg-[#22272B] sticky top-0 z-20">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="material-symbols-outlined text-[#579DFF] text-2xl mt-0.5">
              space_dashboard
            </span>
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
                  className="w-full bg-[#1D2125] text-white text-lg font-bold px-2 py-1 rounded-lg border border-[#579DFF] focus:outline-none"
                />
              ) : (
                <h1
                  onClick={() => !isReadOnly && setIsEditingTitle(true)}
                  className={`text-lg font-bold text-white leading-snug tracking-tight truncate ${
                    !isReadOnly ? 'cursor-pointer hover:text-[#579DFF]' : ''
                  }`}
                  title={!isReadOnly ? 'Click to edit title' : undefined}
                >
                  {card.title}
                </h1>
              )}

              <div className="mt-1 flex items-center gap-2 text-xs text-[#8C9BAB]">
                <span>in list</span>
                <span className="font-semibold text-white underline underline-offset-2">
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
                      ? 'text-[#4BCE97] hover:underline'
                      : 'text-[#8C9BAB] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {card.isComplete ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>{card.isComplete ? 'Completed' : 'Mark complete'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C9BAB] hover:text-white hover:bg-[#2C333A] transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Modal Body: Two-Column Layout */}
        <div className="overflow-y-auto p-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
            {/* Left Column (Primary ~60%) */}
            <div className="md:col-span-7 flex flex-col gap-6">
              {/* Metadata Badges: Members, Labels, Due Date */}
              <div className="flex flex-col gap-3 pb-4 border-b border-[#38414A]">
                <div className="flex flex-wrap gap-5 items-start text-xs">
                  {/* Members */}
                  {card.members.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9BAB]">
                        Members
                      </span>
                      <div className="flex items-center -space-x-1.5">
                        {card.members.map((m) => (
                          <div
                            key={m.id}
                            className="w-7 h-7 rounded-full bg-[#38414A] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#22272B]"
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
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9BAB]">
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
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9BAB]">
                        Due Date
                      </span>
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border shadow-xs ${dueDateStatus.colorClass}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          calendar_today
                        </span>
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
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsMemberMenuOpen(!isMemberMenuOpen)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2C333A] hover:bg-[#333B44] text-[#B6C2CF] hover:text-white text-xs font-medium border border-[#38414A] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px] text-[#579DFF]">
                          person_add
                        </span>
                        <span>Assign</span>
                      </button>

                      {isMemberMenuOpen && (
                        <div className="absolute left-0 mt-1 w-52 bg-[#22272B] border border-[#38414A] rounded-xl shadow-xl p-2 z-30">
                          <span className="text-[10px] font-bold text-[#8C9BAB] uppercase tracking-wider block mb-1 px-1">
                            Board Members
                          </span>
                          <div className="flex flex-col gap-1">
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
                                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left text-white hover:bg-[#2C333A]"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[#579DFF]/20 text-[#579DFF] text-[9px] font-bold flex items-center justify-center">
                                      {bm.user.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="truncate">{bm.user.name}</span>
                                  </div>
                                  {isAssigned && (
                                    <span className="material-symbols-outlined text-[#579DFF] text-[16px]">
                                      check
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Labels Pill */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsLabelMenuOpen(!isLabelMenuOpen)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2C333A] hover:bg-[#333B44] text-[#B6C2CF] hover:text-white text-xs font-medium border border-[#38414A] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px] text-[#4BCE97]">
                          label
                        </span>
                        <span>Labels</span>
                      </button>

                      {isLabelMenuOpen && (
                        <div className="absolute left-0 mt-1 w-52 bg-[#22272B] border border-[#38414A] rounded-xl shadow-xl p-2 z-30">
                          <span className="text-[10px] font-bold text-[#8C9BAB] uppercase tracking-wider block mb-1 px-1">
                            Labels
                          </span>
                          <div className="flex flex-col gap-1">
                            {board.labels.map((lbl) => {
                              const isAssigned = card.labels.some((l) => l.id === lbl.id);
                              return (
                                <button
                                  key={lbl.id}
                                  type="button"
                                  onClick={async () => {
                                    if (isAssigned) {
                                      await unassignLabel(card.id, lbl.id);
                                    } else {
                                      await assignLabel(card.id, lbl.id);
                                    }
                                    refreshCard();
                                  }}
                                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left text-white hover:bg-[#2C333A]"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0"
                                      style={{ backgroundColor: lbl.color }}
                                    />
                                    <span className="truncate">{lbl.name}</span>
                                  </div>
                                  {isAssigned && (
                                    <span className="material-symbols-outlined text-[#579DFF] text-[16px]">
                                      check
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Due Date Pill */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2C333A] hover:bg-[#333B44] text-[#B6C2CF] hover:text-white text-xs font-medium border border-[#38414A] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px] text-[#F5CD47]">
                          schedule
                        </span>
                        <span>Dates</span>
                      </button>

                      {isDateMenuOpen && (
                        <div className="absolute left-0 mt-1 w-64 bg-[#22272B] border border-[#38414A] rounded-xl shadow-xl p-3 z-30 flex flex-col gap-2">
                          <span className="text-xs font-semibold text-white">Set Due Date</span>
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
                              setIsDateMenuOpen(false);
                            }}
                            className="bg-[#1D2125] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#38414A] focus:outline-none"
                          />
                          {card.dueDate && (
                            <button
                              type="button"
                              onClick={() => {
                                updateCardMutation.mutate({ dueDate: null });
                                setIsDateMenuOpen(false);
                              }}
                              className="text-xs text-red-400 hover:underline text-left mt-1"
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
                      onClick={() => setIsAddChecklistOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2C333A] hover:bg-[#333B44] text-[#B6C2CF] hover:text-white text-xs font-medium border border-[#38414A] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#9F8FEF]">
                        checklist
                      </span>
                      <span>Checklist</span>
                    </button>

                    {/* Attachment Pill */}
                    <button
                      type="button"
                      onClick={() => setIsAddAttachOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2C333A] hover:bg-[#333B44] text-[#B6C2CF] hover:text-white text-xs font-medium border border-[#38414A] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#8C9BAB]">
                        attach_file
                      </span>
                      <span>Attach</span>
                    </button>

                    {/* Cover Color Pill */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCoverMenuOpen(!isCoverMenuOpen)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2C333A] hover:bg-[#333B44] text-[#B6C2CF] hover:text-white text-xs font-medium border border-[#38414A] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px] text-[#579DFF]">
                          palette
                        </span>
                        <span>Cover</span>
                      </button>

                      {isCoverMenuOpen && (
                        <div className="absolute left-0 mt-1 w-60 bg-[#22272B] border border-[#38414A] rounded-xl shadow-xl p-3 z-30 flex flex-col gap-2">
                          <span className="text-xs font-semibold text-white">Cover Color</span>
                          <div className="grid grid-cols-4 gap-2">
                            {COVER_COLORS.map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => {
                                  updateCardMutation.mutate({ coverColor: c.color });
                                  setIsCoverMenuOpen(false);
                                }}
                                className="w-8 h-8 rounded-lg transition-transform hover:scale-105"
                                style={{ backgroundColor: c.color }}
                                title={c.name}
                              />
                            ))}
                          </div>
                          {card.coverColor && (
                            <button
                              type="button"
                              onClick={() => {
                                updateCardMutation.mutate({ coverColor: null });
                                setIsCoverMenuOpen(false);
                              }}
                              className="text-xs text-red-400 hover:underline text-left mt-1"
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
                    <span className="material-symbols-outlined text-[#8C9BAB] text-lg">
                      subject
                    </span>
                    <h2 className="text-sm font-semibold text-white">Description</h2>
                  </div>
                  {!isReadOnly && !isEditingDesc && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(true)}
                      className="text-xs font-medium text-[#579DFF] hover:underline"
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
                      className="w-full p-3 rounded-xl bg-[#1D2125] text-white placeholder-[#8C9BAB] text-xs border border-[#38414A] focus:border-[#579DFF] focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateCardMutation.mutate({ description: descInput.trim() });
                          setIsEditingDesc(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#579DFF] hover:bg-[#85B8FF] text-[#1D2125] text-xs font-semibold transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDescInput(card.description || '');
                          setIsEditingDesc(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#8C9BAB] hover:text-white hover:bg-[#2C333A] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !isReadOnly && setIsEditingDesc(true)}
                    className={`p-3 rounded-xl bg-[#1D2125] border border-[#38414A]/70 text-xs text-[#B6C2CF] leading-relaxed min-h-[60px] whitespace-pre-wrap ${
                      !isReadOnly ? 'cursor-pointer hover:border-[#579DFF]/60' : ''
                    }`}
                  >
                    {card.description || (
                      <span className="text-[#8C9BAB] italic">
                        No description provided. Click to add details.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Add Checklist Modal / Inline Input */}
              {isAddChecklistOpen && (
                <div className="p-3 rounded-xl bg-[#1D2125] border border-[#38414A] flex flex-col gap-2">
                  <span className="text-xs font-semibold text-white">Add Checklist</span>
                  <input
                    type="text"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Checklist title..."
                    autoFocus
                    className="px-3 py-1.5 rounded-lg bg-[#22272B] text-white placeholder-[#8C9BAB] text-xs border border-[#38414A] focus:outline-none"
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
                      className="px-3 py-1.5 rounded-lg bg-[#579DFF] text-[#1D2125] text-xs font-semibold"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddChecklistOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-[#8C9BAB] hover:text-white"
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
                        <span className="material-symbols-outlined text-[#8C9BAB] text-lg">
                          check_circle
                        </span>
                        <h2 className="text-sm font-semibold text-white">{ck.title}</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[#8C9BAB]">{percent}%</span>
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
                    <div className="w-full bg-[#1D2125] rounded-full h-2 overflow-hidden border border-[#38414A]">
                      <div
                        className="bg-[#579DFF] h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Checklist Items */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      {ck.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2.5 p-2 rounded-lg hover:bg-[#1D2125] transition-colors group"
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
                              className="mt-0.5 rounded border-[#38414A] text-[#579DFF] focus:ring-0 w-4 h-4"
                            />
                            <span
                              className={`text-xs ${
                                item.isDone
                                  ? 'line-through text-[#8C9BAB]'
                                  : 'text-white'
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
                              className="text-[#8C9BAB] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                delete
                              </span>
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
                              className="px-3 py-1.5 rounded-lg bg-[#1D2125] text-white text-xs border border-[#38414A] focus:outline-none"
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
                                className="px-3 py-1 rounded-lg bg-[#579DFF] text-[#1D2125] text-xs font-semibold"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveChecklistInput(null);
                                  setChecklistItemText('');
                                }}
                                className="px-2 py-1 rounded-lg text-xs text-[#8C9BAB] hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveChecklistInput(ck.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#579DFF] hover:underline self-start mt-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
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
                    <span className="material-symbols-outlined text-[#8C9BAB] text-lg">
                      attach_file
                    </span>
                    <h2 className="text-sm font-semibold text-white">Attachments</h2>
                    <span className="text-xs text-[#8C9BAB]">({card.attachments.length})</span>
                  </div>
                </div>

                {/* Attachments Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {card.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-[#38414A] bg-[#1D2125] group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#2C333A] text-[#579DFF] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          description
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{att.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#579DFF] hover:underline"
                          >
                            Open
                          </a>
                          {!isReadOnly && (
                            <>
                              <span className="text-[#8C9BAB]">•</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteAttachment(att.id);
                                  refreshCard();
                                }}
                                className="text-red-400 hover:underline"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Attachment Form */}
                {isAddAttachOpen && !isReadOnly && (
                  <div className="p-3 rounded-xl bg-[#1D2125] border border-[#38414A] flex flex-col gap-2">
                    <span className="text-xs font-semibold text-white">Add Attachment</span>
                    <input
                      type="text"
                      value={attachName}
                      onChange={(e) => setAttachName(e.target.value)}
                      placeholder="Attachment name (e.g. Design Specs.fig)"
                      className="px-3 py-1.5 rounded-lg bg-[#22272B] text-white text-xs border border-[#38414A] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={attachUrl}
                      onChange={(e) => setAttachUrl(e.target.value)}
                      placeholder="Paste link URL (e.g. https://...)"
                      className="px-3 py-1.5 rounded-lg bg-[#22272B] text-white text-xs border border-[#38414A] focus:outline-none"
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
                        className="px-3 py-1.5 rounded-lg bg-[#579DFF] text-[#1D2125] text-xs font-semibold"
                      >
                        Attach
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddAttachOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#8C9BAB] hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Actions & Comments Stream (~40%) */}
            <div className="md:col-span-5 flex flex-col gap-4 border-l border-[#38414A] pl-0 md:pl-6">
              {/* Card Actions (Move & Delete) */}
              {!isReadOnly && (
                <div className="flex flex-col gap-2 pb-3 border-b border-[#38414A]">
                  <span className="text-[11px] font-semibold text-[#8C9BAB] uppercase tracking-wider">
                    Actions
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Move to another list */}
                    <div className="flex flex-col gap-1">
                      <select
                        value={card.listId}
                        onChange={(e) => {
                          updateCardMutation.mutate({ listId: e.target.value });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#1D2125] text-white text-xs border border-[#38414A] focus:outline-none"
                      >
                        {board.lists.map((l) => (
                          <option key={l.id} value={l.id}>
                            Move to: {l.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delete card */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete card "${card.title}"?`)) {
                          deleteCardMutation.mutate();
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-medium border border-red-800/60 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Delete card</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Activity & Comments Header with "Show details" toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8C9BAB] text-lg">forum</span>
                  <h2 className="text-sm font-semibold text-white">Activity & Comments</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-[#579DFF] hover:underline font-medium"
                >
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
              </div>

              {/* Add Comment Box */}
              {!isReadOnly && (
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-[#579DFF] text-[#1D2125] shrink-0 font-bold text-xs flex items-center justify-center">
                    {user?.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-[#1D2125] border border-[#38414A] rounded-xl p-2.5 flex flex-col gap-2">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Write a comment..."
                      rows={2}
                      className="w-full text-xs text-white placeholder-[#8C9BAB] bg-transparent border-none p-0 focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-end pt-1 border-t border-[#38414A]/50">
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
                        className="px-3 py-1 bg-[#579DFF] hover:bg-[#85B8FF] text-[#1D2125] text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
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
                    <div className="w-7 h-7 rounded-full bg-[#38414A] text-white text-[10px] font-bold shrink-0 flex items-center justify-center">
                      {cm.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-white">
                          {cm.user.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#8C9BAB]">
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
                              className="text-[#8C9BAB] hover:text-red-400"
                              title="Delete comment"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                delete
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 p-2 rounded-xl bg-[#1D2125] text-xs text-[#B6C2CF] border border-[#38414A]/60 leading-relaxed whitespace-pre-wrap">
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
                        className="flex gap-2 items-center text-[11px] text-[#8C9BAB] px-1 py-0.5"
                      >
                        <span className="material-symbols-outlined text-[14px] text-[#579DFF]">
                          history
                        </span>
                        <p className="truncate">
                          <span className="font-medium text-white">{act.user.name}</span>{' '}
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
