import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoardBundle } from '@workaholic/shared';
import { deleteBoard } from '../../api/boards.js';
import { Icon } from '../ui/Icon.js';
import { AvatarStack } from '../ui/Avatar.js';
import { AccountMenu } from '../navigation/AccountMenu.js';
import { DeleteBoardModal } from './DeleteBoardModal.js';

interface BoardHeaderProps {
  board: BoardBundle;
  searchFilter: string;
  onSearchChange: (filter: string) => void;
  onToggleStar: () => void;
  onUpdateTitle: (newTitle: string) => Promise<void>;
  onOpenShareModal: () => void;
  onOpenAISummary?: () => void;
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
  onOpenAISummary,
  onToggleActivity,
  isActivityOpen,
}) => {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  return (
    <div className="flex flex-col w-full z-20">
      {/* Read-Only Banner for Viewer */}
      {isReadOnly && (
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-2.5 flex items-center justify-between text-xs text-text-primary">
          <div className="flex items-center gap-2">
            <Icon name="visibility" size={18} className="text-primary" />
            <span className="font-semibold text-text-primary">Read-Only Mode:</span>
            <span className="text-text-muted">You have viewer permissions. You can inspect cards and discussion, but editing is disabled.</span>
          </div>
          <button
            type="button"
            className="text-[11px] bg-surface-container hover:bg-surface-container-high text-text-primary px-2.5 py-1 rounded-lg border border-border font-medium flex items-center gap-1.5 transition shadow-2xs"
          >
            <Icon name="visibility" size={14} className="text-primary" />
            <span>Viewer access</span>
          </button>
        </div>
      )}

      {/* Main Board Sub-Header */}
      <header className="h-14 bg-surface/85 backdrop-blur-md border-b border-border px-6 flex items-center justify-between select-none">
        {/* Left: Breadcrumbs & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/boards')}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <Icon name="arrow_back" size={16} />
            <span>Boards</span>
          </button>
          <span className="text-text-muted text-sm select-none">/</span>

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
                className="bg-surface-container text-text-primary text-base font-bold px-2 py-0.5 rounded-lg border border-primary focus:outline-none"
              />
            ) : (
              <h1
                onClick={() => !isReadOnly && setIsEditingTitle(true)}
                className={`text-base font-bold text-text-primary tracking-tight ${
                  !isReadOnly ? 'cursor-pointer hover:text-primary' : ''
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
              className="p-1 rounded-lg text-text-muted hover:text-accent-warning transition-colors"
              title={board.isStarred ? 'Unstar board' : 'Star board'}
            >
              <Icon
                name={board.isStarred ? 'star' : 'star_border'}
                filled={board.isStarred}
                size={20}
                className={board.isStarred ? 'text-accent-warning' : ''}
              />
            </button>

            {/* Role Badge: High-contrast pill */}
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-text-primary border border-border shadow-2xs">
              {board.userRole}
            </span>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-3">
          {/* Card Filter Input */}
          <div className="relative flex items-center">
            <Icon name="search" size={16} className="absolute left-2.5 text-text-muted" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter tasks..."
              className="bg-surface-container text-text-primary placeholder:text-text-muted text-xs rounded-xl pl-8 pr-3 py-1.5 border border-border focus:border-primary focus:outline-none w-48 transition-all"
            />
          </div>

          {/* Member Avatars Stack */}
          <AvatarStack
            users={board.members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              avatarUrl: m.user.avatarUrl,
            }))}
            size={28}
            max={4}
          />

          {/* Share Button (Owner only per SPEC) */}
          {isOwner && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-on-primary text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition-all"
            >
              <Icon name="person_add" size={16} />
              <span>Share</span>
            </button>
          )}

          {/* Delete Board Button (Owner only) */}
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              aria-label="Delete Board"
              className="flex items-center gap-1.5 bg-accent-danger/10 hover:bg-accent-danger/20 text-accent-danger border border-accent-danger/30 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-all"
              title="Delete Board"
            >
              <Icon name="delete" size={16} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          {/* AI Board Summary Button */}
          {onOpenAISummary && (
            <button
              type="button"
              onClick={onOpenAISummary}
              aria-label="AI Board Summary"
              className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-primary border border-primary/30 hover:border-primary/50 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-all"
              title="AI Board Summary"
            >
              <Icon name="auto_awesome" size={16} className="text-primary" />
              <span className="hidden sm:inline">AI Summary</span>
            </button>
          )}

          {/* Activity Drawer Toggle */}
          <button
            type="button"
            onClick={onToggleActivity}
            aria-label="Activity Feed"
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
              isActivityOpen
                ? 'bg-accent-subtle text-primary border-primary/40'
                : 'text-text-body hover:text-text-primary hover:bg-surface-container border-border'
            }`}
            title="Activity Feed"
          >
            <Icon name="history" size={18} />
          </button>

          <div className="h-4 w-px bg-border"></div>

          {/* Account Menu */}
          <AccountMenu />
        </div>
      </header>

      {/* Delete Board Confirmation Modal */}
      {isOwner && (
        <DeleteBoardModal
          isOpen={isDeleteModalOpen}
          boardTitle={board.title}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async () => {
            await deleteBoard(board.id);
            navigate('/boards');
          }}
        />
      )}
    </div>
  );
};
