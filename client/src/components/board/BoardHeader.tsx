import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoardBundle } from '@workaholic/shared';

interface BoardHeaderProps {
  board: BoardBundle;
  searchFilter: string;
  onSearchChange: (filter: string) => void;
  onToggleStar: () => void;
  onUpdateTitle: (newTitle: string) => Promise<void>;
  onOpenShareModal: () => void;
  onToggleActivity: () => void;
  isActivityOpen: boolean;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  searchFilter,
  onSearchChange,
  onToggleStar,
  onUpdateTitle,
  onOpenShareModal,
  onToggleActivity,
  isActivityOpen,
}) => {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(board.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = board.userRole === 'viewer';
  const isOwner = board.userRole === 'owner';

  useEffect(() => {
    setTitleInput(board.title);
  }, [board.title]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput.trim() !== board.title) {
      await onUpdateTitle(titleInput.trim());
    } else {
      setTitleInput(board.title);
    }
  };

  const roleBadge = {
    owner: { text: 'Owner', class: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    member: { text: 'Member', class: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    viewer: { text: 'Viewer', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  }[board.userRole];

  return (
    <div className="flex flex-col w-full z-20">
      {/* Read-Only Banner for Viewer (matches taskflow_kanban_board_viewer_read_only) */}
      {isReadOnly && (
        <div className="bg-[#579DFF]/15 border-b border-[#579DFF]/30 px-6 py-2 flex items-center justify-between text-xs text-[#85B8FF]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span className="font-semibold">Read-Only Mode:</span>
            <span>You have viewer permissions. You can inspect cards and discussion, but editing is disabled.</span>
          </div>
          <span className="text-[11px] bg-[#579DFF]/20 px-2 py-0.5 rounded-full border border-[#579DFF]/40">
            Viewer Access
          </span>
        </div>
      )}

      {/* Main Board Sub-Header */}
      <header className="h-14 bg-[#1D2125]/80 backdrop-blur-md border-b border-[#38414A] px-6 flex items-center justify-between select-none">
        {/* Left: Breadcrumbs & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/boards')}
            className="flex items-center gap-1.5 text-xs text-[#8C9BAB] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Boards</span>
          </button>
          <span className="text-[#38414A] text-sm">/</span>

          <div className="flex items-center gap-2">
            {isEditingTitle && !isReadOnly ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTitleInput(board.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="bg-[#22272B] text-white text-base font-bold px-2 py-0.5 rounded-lg border border-[#579DFF] focus:outline-none"
              />
            ) : (
              <h1
                onClick={() => !isReadOnly && setIsEditingTitle(true)}
                className={`text-base font-bold text-white tracking-tight ${
                  !isReadOnly ? 'cursor-pointer hover:text-[#579DFF]' : ''
                }`}
                title={!isReadOnly ? 'Click to rename board' : undefined}
              >
                {board.title}
              </h1>
            )}

            {/* Star Button */}
            <button
              type="button"
              onClick={onToggleStar}
              className="p-1 rounded-lg text-[#8C9BAB] hover:text-[#F5CD47] transition-colors"
              title={board.isStarred ? 'Unstar board' : 'Star board'}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  board.isStarred ? 'text-[#F5CD47]' : ''
                }`}
              >
                {board.isStarred ? 'star' : 'star_border'}
              </span>
            </button>

            {/* Role Badge */}
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${roleBadge.class}`}
            >
              {roleBadge.text}
            </span>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-3">
          {/* Card Filter Input */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-[#8C9BAB] text-[16px]">
              search
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter tasks..."
              className="bg-[#22272B] text-white placeholder-[#8C9BAB] text-xs rounded-xl pl-8 pr-3 py-1.5 border border-[#38414A] focus:border-[#579DFF] focus:outline-none w-48 transition-all"
            />
          </div>

          {/* Member Avatars Stack */}
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {board.members.slice(0, 4).map((m, idx) => (
              <div
                key={m.id || idx}
                className="w-7 h-7 rounded-full bg-[#38414A] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#1D2125]"
                title={`${m.user.name} (${m.role})`}
              >
                {m.user.name.slice(0, 2).toUpperCase()}
              </div>
            ))}
            {board.members.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-[#22272B] text-[#8C9BAB] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#1D2125]">
                +{board.members.length - 4}
              </div>
            )}
          </div>

          {/* Share Button (Owner only per SPEC) */}
          {isOwner && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 bg-[#579DFF] hover:bg-[#85B8FF] text-[#1D2125] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Share</span>
            </button>
          )}

          {/* Activity Drawer Toggle */}
          <button
            type="button"
            onClick={onToggleActivity}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
              isActivityOpen
                ? 'bg-[#579DFF]/20 text-[#579DFF] border-[#579DFF]/40'
                : 'text-[#8C9BAB] hover:text-white hover:bg-[#2C333A] border-[#38414A]'
            }`}
            title="Activity Feed"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
          </button>
        </div>
      </header>
    </div>
  );
};
