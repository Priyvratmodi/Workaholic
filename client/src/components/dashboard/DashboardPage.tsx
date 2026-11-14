import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoardSummary } from '@workaholic/shared';
import { fetchBoards, starBoard, unstarBoard } from '../../api/boards.js';
import { useAuthStore } from '../../stores/authStore.js';
import { CreateBoardModal } from './CreateBoardModal.js';
import { getBackgroundPreviewClass } from '../../utils/backgrounds.js';

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
    <div className="min-h-screen bg-[#1D2125] text-white flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 z-40 bg-[#1D2125]/90 backdrop-blur-md border-b border-[#38414A] flex items-center justify-between px-6 select-none">
        <div className="flex items-center gap-4 pl-[240px]">
          <div className="relative flex items-center">
            <div className="flex items-center bg-[#22272B] rounded-lg px-3 py-1.5 gap-2 border border-[#38414A] hover:border-[#579DFF]/60 focus-within:border-[#579DFF] transition-all w-72">
              <span className="material-symbols-outlined text-[#8C9BAB] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boards..."
                className="bg-transparent w-full text-white placeholder-[#8C9BAB] focus:outline-none text-xs"
              />
              <kbd className="text-[10px] bg-[#2C333A] text-[#8C9BAB] px-1.5 py-0.5 rounded border border-[#38414A]">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#B6C2CF] hover:text-white hover:bg-[#2C333A] transition-colors"
            title="Create Board"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <div className="h-4 w-px bg-[#38414A]"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#579DFF]/20 text-[#579DFF] font-semibold text-xs flex items-center justify-center border border-[#579DFF]/40">
              {user?.name.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-medium text-[#B6C2CF] hidden sm:inline-block">
              {user?.name}
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C9BAB] hover:text-red-400 hover:bg-[#2C333A] transition-colors ml-1"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#22272B] border-r border-[#38414A] flex flex-col z-40">
        <div className="h-14 px-4 flex items-center border-b border-[#38414A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#579DFF] text-[#1D2125] flex items-center justify-center font-bold text-sm shadow">
              W
            </div>
            <span className="text-sm font-bold tracking-tight text-white">Workaholic</span>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="px-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8C9BAB]">
              Workspace
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#579DFF]/15 text-[#579DFF] font-medium text-xs text-left"
            >
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              <span>Boards</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#B6C2CF] hover:bg-[#2C333A] hover:text-white transition-all text-xs text-left"
            >
              <span className="material-symbols-outlined text-[18px]">auto_stories</span>
              <span>Templates</span>
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#579DFF] hover:bg-[#85B8FF] text-[#1D2125] py-2 px-3 rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create board</span>
          </button>
        </div>

        {/* Starred Boards In Sidebar */}
        {starredBoards.length > 0 && (
          <div className="px-4 py-2 border-t border-[#38414A]/60 flex-1 overflow-y-auto">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8C9BAB] px-1 block mb-2">
              Starred Boards
            </span>
            <div className="flex flex-col gap-1">
              {starredBoards.map((sb) => (
                <button
                  key={sb.id}
                  type="button"
                  onClick={() => navigate(`/boards/${sb.id}`)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#B6C2CF] hover:bg-[#2C333A] hover:text-white transition-colors text-left truncate"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#F5CD47]">
                    star
                  </span>
                  <span className="truncate">{sb.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto p-4 border-t border-[#38414A] flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-[#579DFF]/20 text-[#579DFF] font-semibold text-[11px] flex items-center justify-center shrink-0">
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-medium text-white truncate leading-tight">
                {user?.name}
              </span>
              <span className="text-[10px] text-[#8C9BAB] truncate">{user?.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="text-[#8C9BAB] hover:text-red-400 p-1 rounded hover:bg-[#2C333A] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#579DFF]/15 text-[#579DFF]">
                  Workaholic Workspace
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#8C9BAB]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4BCE97]"></span>
                  {boards.length} Active {boards.length === 1 ? 'Board' : 'Boards'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {greeting}, {user?.name.split(' ')[0]}
              </h1>
              <p className="text-sm text-[#8C9BAB]">
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
                  className="flex items-center gap-2 bg-[#22272B] hover:bg-[#2C333A] text-white px-3.5 py-2 rounded-xl text-xs font-medium border border-[#38414A] shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[#8C9BAB] text-[16px]">
                    sort
                  </span>
                  <span>
                    {sortBy === 'recent'
                      ? 'Recently updated'
                      : sortBy === 'alpha'
                      ? 'Alphabetical (A-Z)'
                      : 'Most active tasks'}
                  </span>
                  <span className="material-symbols-outlined text-[#8C9BAB] text-[16px]">
                    expand_more
                  </span>
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#22272B] border border-[#38414A] shadow-xl py-1 z-30">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('recent');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-[#2C333A] text-white flex items-center justify-between"
                    >
                      <span>Recently updated</span>
                      {sortBy === 'recent' && (
                        <span className="material-symbols-outlined text-[#579DFF] text-[16px]">
                          check
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('alpha');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-[#2C333A] text-white flex items-center justify-between"
                    >
                      <span>Alphabetical (A-Z)</span>
                      {sortBy === 'alpha' && (
                        <span className="material-symbols-outlined text-[#579DFF] text-[16px]">
                          check
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('tasks');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-[#2C333A] text-white flex items-center justify-between"
                    >
                      <span>Most active tasks</span>
                      {sortBy === 'tasks' && (
                        <span className="material-symbols-outlined text-[#579DFF] text-[16px]">
                          check
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* New Board Primary CTA */}
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-[#579DFF] hover:bg-[#85B8FF] text-[#1D2125] px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>New board</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400">error</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadBoards}
                className="text-xs text-red-300 underline hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Starred Boards Section (if any) */}
          {starredBoards.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="material-symbols-outlined text-[#F5CD47] text-[18px]">star</span>
                <h2>Starred Boards</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {starredBoards.map((b) => (
                  <BoardCard
                    key={`starred-${b.id}`}
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
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="material-symbols-outlined text-[#579DFF] text-[18px]">
                  dashboard
                </span>
                <h2>Your Boards</h2>
              </div>
              {filteredBoards.length > 0 && (
                <span className="text-xs text-[#8C9BAB]">
                  Showing {filteredBoards.length} of {boards.length}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-44 rounded-2xl bg-[#22272B] border border-[#38414A] animate-pulse p-4 flex flex-col justify-between"
                  >
                    <div className="h-6 w-3/4 bg-[#2C333A] rounded"></div>
                    <div className="h-4 w-1/2 bg-[#2C333A] rounded"></div>
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
                  className="min-h-[170px] rounded-2xl bg-[#22272B]/50 hover:bg-[#2C333A]/60 border border-dashed border-[#38414A] hover:border-[#579DFF]/60 transition-all duration-200 p-5 flex flex-col items-center justify-center text-center gap-3 group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#2C333A] text-[#579DFF] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#579DFF] group-hover:text-[#1D2125] transition-all">
                    <span className="material-symbols-outlined text-[24px]">add</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-white group-hover:text-[#579DFF] transition-colors">
                      Create new board
                    </span>
                    <span className="text-xs text-[#8C9BAB]">From template or blank</span>
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

  const roleBadgeColor = {
    owner: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    member: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    viewer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  }[board.userRole];

  return (
    <div
      onClick={onOpen}
      className="group relative rounded-2xl bg-[#22272B] hover:bg-[#2C333A] border border-[#38414A] hover:border-[#579DFF]/60 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col shadow-sm hover:shadow-md"
    >
      {/* Thumbnail Gradient Header */}
      <div className={`h-24 w-full ${previewClass} p-3 flex items-start justify-between relative`}>
        {/* Role badge */}
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm ${roleBadgeColor}`}
        >
          {board.userRole}
        </span>

        {/* Star Button */}
        <button
          type="button"
          onClick={onToggleStar}
          className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md transition-all ${
            board.isStarred
              ? 'bg-black/40 text-[#F5CD47]'
              : 'bg-black/30 text-white/70 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
          title={board.isStarred ? 'Unstar board' : 'Star board'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {board.isStarred ? 'star' : 'star_border'}
          </span>
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white group-hover:text-[#579DFF] transition-colors truncate">
            {board.title}
          </h3>
          <p className="text-xs text-[#8C9BAB] mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">task_alt</span>
            <span>{board.activeTasksCount} active tasks</span>
          </p>
        </div>

        {/* Card Footer: Members Avatars */}
        <div className="flex items-center justify-between pt-2 border-t border-[#38414A]/60">
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {board.members.slice(0, 4).map((m, idx) => (
              <div
                key={m.id || idx}
                className="w-6 h-6 rounded-full bg-[#38414A] text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-[#22272B]"
                title={m.name}
              >
                {m.name.slice(0, 2).toUpperCase()}
              </div>
            ))}
            {board.members.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-[#1D2125] text-[#8C9BAB] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#22272B]">
                +{board.members.length - 4}
              </div>
            )}
          </div>

          <span className="text-[11px] text-[#8C9BAB]">
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
