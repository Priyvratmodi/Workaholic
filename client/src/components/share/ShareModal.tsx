import React, { useState, useEffect } from 'react';
import { BoardBundle, Role } from '@workaholic/shared';
import { inviteMember, updateMemberRole, removeMember } from '../../api/members.js';
import { useAuthStore } from '../../stores/authStore.js';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: BoardBundle;
  onMembersChanged: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  board,
  onMembersChanged,
}) => {
  const { user } = useAuthStore();
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

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

  const handleCopyLink = () => {
    const url = `${window.location.origin}/boards/${board.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);
      await inviteMember(board.id, emailInput.trim(), selectedRole);
      setEmailInput('');
      setSuccessMsg(`Invited ${emailInput.trim()} as ${selectedRole}!`);
      onMembersChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to invite user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: Role) => {
    try {
      setError(null);
      await updateMemberRole(board.id, targetUserId, newRole);
      onMembersChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to update member role');
    }
  };

  const handleRemove = async (targetUserId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this board?`)) {
      return;
    }
    try {
      setError(null);
      await removeMember(board.id, targetUserId);
      onMembersChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove member');
    }
  };

  const ownerCount = board.members.filter((m) => m.role === 'owner').length;
  const isCallerOwner = board.userRole === 'owner';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#22272B] border border-[#38414A] rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-white max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-2 border-b border-[#38414A]">
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-white tracking-tight">
              Share “{board.title}” board
            </h2>
            <p className="text-xs text-[#8C9BAB] mt-0.5">
              Invite teammates and collaborate in real-time with role-based controls.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C9BAB] hover:text-white hover:bg-[#2C333A] transition-colors -mr-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-red-400 text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">
              check_circle
            </span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Invite by Email Row (Owner only) */}
        {isCallerOwner ? (
          <form onSubmit={handleInvite} className="flex flex-col gap-2">
            <label className="text-[11px] uppercase tracking-wider text-[#8C9BAB] font-semibold">
              Invite by Email
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center bg-[#1D2125] rounded-xl px-3 py-1.5 border border-[#38414A] focus-within:border-[#579DFF] transition-all">
                <span className="material-symbols-outlined text-[#8C9BAB] text-[18px] mr-2">
                  mail
                </span>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email address..."
                  className="bg-transparent w-full text-white placeholder-[#8C9BAB] focus:outline-none text-xs"
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="bg-[#2C333A] text-white text-[11px] font-semibold py-1 px-2 rounded-lg border border-[#38414A] focus:outline-none shrink-0 ml-2"
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || !emailInput.trim()}
                className="h-9 px-4 rounded-xl bg-[#579DFF] hover:bg-[#85B8FF] text-[#1D2125] text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Invite</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 rounded-xl bg-[#1D2125] border border-[#38414A] text-xs text-[#8C9BAB]">
            Only the board owner can invite new members.
          </div>
        )}

        {/* Copy Link Row */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#1D2125] border border-[#38414A]">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="w-8 h-8 rounded-lg bg-[#2C333A] text-[#579DFF] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">link</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                Board share link
              </span>
              <span className="text-[11px] text-[#8C9BAB] truncate">
                {window.location.origin}/boards/{board.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="h-8 px-3 rounded-lg bg-[#2C333A] hover:bg-[#333B44] text-white text-xs font-medium border border-[#38414A] transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] text-[#579DFF]">
              {isCopied ? 'check' : 'content_copy'}
            </span>
            <span>{isCopied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>

        {/* Board Members List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[#8C9BAB] font-semibold">
                Board Members
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#2C333A] text-[#8C9BAB] text-[10px] font-bold">
                {board.members.length}
              </span>
            </div>
            <span className="text-[11px] text-[#8C9BAB]">
              {isCallerOwner ? 'Manage roles & access' : 'View members'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {board.members.map((mem) => {
              const isCurrentUser = mem.userId === user?.id;
              const isSoleOwner = mem.role === 'owner' && ownerCount <= 1;

              return (
                <div
                  key={mem.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#1D2125] border border-[#38414A]/70 group hover:border-[#579DFF]/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#38414A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {mem.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {mem.user.name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-[#579DFF] font-medium">
                            (You)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#8C9BAB] truncate">
                        {mem.user.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role dropdown or locked badge */}
                    {isCallerOwner && !isSoleOwner ? (
                      <select
                        value={mem.role}
                        onChange={(e) => handleRoleChange(mem.userId, e.target.value as Role)}
                        className="bg-[#2C333A] text-white text-[11px] font-medium py-1 px-2 rounded-lg border border-[#38414A] focus:outline-none"
                      >
                        <option value="owner">Owner</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2C333A] text-[#B6C2CF] text-[11px] font-medium border border-[#38414A]">
                        {isSoleOwner && (
                          <span className="material-symbols-outlined text-[13px] text-[#F5CD47]">
                            lock
                          </span>
                        )}
                        <span className="capitalize">{mem.role}</span>
                      </div>
                    )}

                    {/* Remove Member Button */}
                    {isCallerOwner && !isSoleOwner && !isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => handleRemove(mem.userId, mem.user.name)}
                        className="text-[#8C9BAB] hover:text-red-400 p-1 rounded hover:bg-[#2C333A] transition-colors"
                        title="Remove member"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          person_remove
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
