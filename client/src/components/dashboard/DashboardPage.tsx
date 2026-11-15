import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoardSummary } from '@workaholic/shared';
import { fetchBoards, starBoard, unstarBoard } from '../../api/boards.js';
import { useAuthStore } from '../../stores/authStore.js';
import { CreateBoardModal } from './CreateBoardModal.js';
import { getBackgroundPreviewClass } from '../../utils/backgrounds.js';
import { Icon } from '../ui/Icon.js';
import { Avatar, AvatarStack } from '../ui/Avatar.js';
import { AccountMenu } from '../navigation/AccountMenu.js';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha' | 'tasks'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadBoards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchBoards();
      setBoards(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleToggleStar = async (e: React.MouseEvent, board: BoardSummary) => {
    e.stopPropagation();
    const prevStarred = board.isStarred;
    // Optimistic update
    setBoards((prev) =>
      prev.map((b) => (b.id === board.id ? { ...b, isStarred: !prevStarred } : b))
    );

    try {
      if (prevStarred) {
        await unstarBoard(board.id);
      } else {
        await starBoard(board.id);
      }
    } catch {
      // Revert on error
      setBoards((prev) =>
        prev.map((b) => (b.id === board.id ? { ...b, isStarred: prevStarred } : b))
      );
    }
  };

  const filteredBoards = useMemo(() => {
    let result = boards.filter((b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'tasks') {
      result.sort((a, b) => b.activeTasksCount - a.activeTasksCount);
    } else {
      // Recent / updated
      result.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    return result;
  }, [boards, searchQuery, sortBy]);

  const starredBoards = useMemo(
    () => filteredBoards.filter((b) => b.isStarred),
    [filteredBoards]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-text-secondary flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 z-40 bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between px-6 select-none">
        <div className="flex items-center gap-4 pl-[240px]">
          <div className="relative flex items-center">
            <div className="flex items-center bg-surface-container rounded-xl px-3 py-1.5 gap-2 border border-border hover:border-primary/60 focus-within:border-primary transition-all w-72">
              <Icon name="search" size={18} className="text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boards..."
                className="bg-transparent w-full text-text-primary placeholder:text-text-muted focus:outline-none text-xs"
              />
              <kbd className="text-[10px] bg-surface-container-high text-text-muted px-1.5 py-0.5 rounded border border-border">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Account Menu */}
          <AccountMenu />
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-sidebar border-r border-border flex flex-col z-40">
        <div className="h-14 px-4 flex items-center border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-on-primary flex items-center justify-center font-bold text-sm shadow">
              W
            </div>
            <span className="text-sm font-bold tracking-tight text-text-primary">Workaholic</span>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="px-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">
              Workspace
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-accent-subtle text-primary font-semibold text-xs text-left transition-colors"
            >
              <Icon name="space_dashboard" size={18} />
              <span>Boards</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-text-body hover:bg-surface-card-hover hover:text-text-primary transition-all text-xs text-left"
            >
              <Icon name="auto_stories" size={18} />
              <span>Templates</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-text-body hover:bg-surface-card-hover hover:text-text-primary transition-all text-xs text-left"
            >
              <Icon name="settings" size={18} />
              <span>Settings</span>
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-on-primary py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Icon name="add" size={18} />
            <span>Create board</span>
          </button>
        </div>

        {/* Starred Boards In Sidebar */}
        {starredBoards.length > 0 && (
          <div className="px-4 py-2 border-t border-border/60 flex-1 overflow-y-auto">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-text-muted px-1 block mb-2">
              Starred Boards
            </span>
            <div className="flex flex-col gap-1">
              {starredBoards.map((sb) => (
                <button
                  key={sb.id}
                  type="button"
                  onClick={() => navigate(`/boards/${sb.id}`)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-surface-container hover:text-text-primary transition-colors text-left truncate"
                >
                  <Icon name="star" filled size={16} className="text-accent-warning" />
                  <span className="truncate">{sb.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar Footer User Info */}
        <div className="mt-auto p-4 border-t border-border flex items-center justify-between gap-2 min-w-0 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Avatar name={user?.name || 'User'} avatarUrl={user?.avatarUrl} size={32} />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-text-primary truncate leading-tight">
                {user?.name}
              </span>
              <span className="text-[10px] text-text-muted truncate">{user?.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="text-text-muted hover:text-accent-danger p-1 rounded hover:bg-surface-container transition-colors"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-[240px] pt-14 flex-1">
        <main className="w-full max-w-7xl mx-auto px-8 py-8 flex flex-col gap-8">
          {/* Greeting Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div className="flex flex-col gap-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                  Workaholic Workspace
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-success"></span>
                  {boards.length} Active {boards.length === 1 ? 'Board' : 'Boards'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {greeting}, {user?.name.split(' ')[0]}
              </h1>
              <p className="text-sm text-text-muted">
                Orchestrate sprints, deliverables, and initiatives with real-time drag-and-drop
                precision.
              </p>
            </div>

            {/* Utility Controls */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high text-text-primary px-3.5 py-2 rounded-xl text-xs font-medium border border-border shadow-xs transition-colors"
                >
                  <Icon name="sort" size={16} className="text-text-muted" />
                  <span>
                    {sortBy === 'recent'
                      ? 'Recently updated'
                      : sortBy === 'alpha'
                      ? 'Alphabetical (A-Z)'
                      : 'Most active tasks'}
                  </span>
                  <Icon name="expand_more" size={16} className="text-text-muted" />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-menu border border-border shadow-menu py-1 z-30">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('recent');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-menu-hover text-text-primary flex items-center justify-between"
                    >
                      <span>Recently updated</span>
                      {sortBy === 'recent' && (
                        <Icon name="check" size={16} className="text-primary" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('alpha');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-menu-hover text-text-primary flex items-center justify-between"
                    >
                      <span>Alphabetical (A-Z)</span>
                      {sortBy === 'alpha' && (
                        <Icon name="check" size={16} className="text-primary" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('tasks');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-menu-hover text-text-primary flex items-center justify-between"
                    >
                      <span>Most active tasks</span>
                      {sortBy === 'tasks' && (
                        <Icon name="check" size={16} className="text-primary" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-sm flex items-center gap-3">
              <Icon name="error" size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Starred Boards Grid */}
          {starredBoards.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Icon name="star" filled size={18} className="text-accent-warning" />
                <h2>Starred Boards</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {starredBoards.map((b) => (
                  <BoardCard
                    key={b.id}
                    board={b}
                    onOpen={() => navigate(`/boards/${b.id}`)}
                    onToggleStar={(e) => handleToggleStar(e, b)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Boards Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Icon name="dashboard" size={18} className="text-primary" />
                <h2>Your Boards</h2>
              </div>
              {filteredBoards.length > 0 && (
                <span className="text-xs text-text-muted">
                  Showing {filteredBoards.length} of {boards.length}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-44 rounded-2xl bg-surface-container border border-border animate-pulse p-4 flex flex-col justify-between"
                  >
                    <div className="h-6 w-3/4 bg-surface-container-high rounded"></div>
                    <div className="h-4 w-1/2 bg-surface-container-high rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBoards.map((b) => (
                  <BoardCard
                    key={b.id}
                    board={b}
                    onOpen={() => navigate(`/boards/${b.id}`)}
                    onToggleStar={(e) => handleToggleStar(e, b)}
                  />
                ))}

                {/* Create New Board Tile */}
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="min-h-[170px] rounded-2xl bg-surface-container/50 hover:bg-surface-container-high/60 border border-dashed border-border hover:border-primary/60 transition-all duration-200 p-5 flex flex-col items-center justify-center text-center gap-3 group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-surface-container-high text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-on-primary transition-all">
                    <Icon name="add" size={24} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                      Create new board
                    </span>
                    <span className="text-xs text-text-muted">From template or blank</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadBoards}
      />
    </div>
  );
};

interface BoardCardProps {
  board: BoardSummary;
  onOpen: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, onOpen, onToggleStar }) => {
  const previewClass = getBackgroundPreviewClass(board.background);

  return (
    <div
      onClick={onOpen}
      className="group relative rounded-2xl bg-card hover:bg-card-hover border border-border hover:border-primary/60 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col shadow-xs hover:shadow-card-hover"
    >
      {/* Thumbnail Gradient Header with pastel styling */}
      <div className={`h-24 w-full board-tile-gradient ${previewClass} p-3 flex items-start justify-between relative`}>
        {/* Role badge: Solid high-contrast pill on pastel */}
        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/95 text-text-primary border border-border shadow-2xs select-none">
          {board.userRole}
        </span>

        {/* Star Button: Always readable and visible */}
        <button
          type="button"
          onClick={onToggleStar}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            board.isStarred
              ? 'bg-white/95 text-primary shadow-2xs'
              : 'bg-white/90 hover:bg-white text-text-muted hover:text-text-primary shadow-2xs'
          }`}
          title={board.isStarred ? 'Unstar board' : 'Star board'}
        >
          <Icon
            name="star"
            filled={board.isStarred}
            size={18}
            className={board.isStarred ? 'text-primary' : 'text-text-muted'}
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
            {board.title}
          </h3>
          <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
            <Icon name="task_alt" size={14} />
            <span>{board.activeTasksCount} active tasks</span>
          </p>
        </div>

        {/* Card Footer: Members Avatars Stack */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <AvatarStack users={board.members} size={28} max={4} />

          <span className="text-[11px] text-text-muted">
            {new Date(board.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
