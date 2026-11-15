import React, { useEffect, useState } from 'react';
import { ActivityInfo } from '@workaholic/shared';
import { apiRequest } from '../../api/client.js';
import { Icon } from '../ui/Icon.js';

interface ActivityDrawerProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  boardId,
  isOpen,
  onClose,
}) => {
  const [activities, setActivities] = useState<ActivityInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadActivities();
    }
  }, [isOpen, boardId]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ activities: ActivityInfo[] }>(
        `/api/boards/${boardId}/activity`
      );
      setActivities(res.activities);
    } catch (err) {
      console.error('Failed to load board activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatActivityText = (act: ActivityInfo) => {
    const p = act.payload || {};
    const userName = act.user?.name || 'Someone';

    switch (act.type) {
      case 'board_created':
        return `${userName} created this board.`;
      case 'board_updated':
        return `${userName} updated the board settings.`;
      case 'list_created':
        return `${userName} added list "${p.listTitle || 'a list'}".`;
      case 'list_updated':
        return `${userName} updated list "${p.listTitle || 'a list'}".`;
      case 'list_deleted':
        return `${userName} deleted list "${p.listTitle || 'a list'}".`;
      case 'card_created':
        return `${userName} added card "${p.cardTitle || 'a card'}" to ${p.listTitle || 'a list'}.`;
      case 'card_moved':
        return `${userName} moved "${p.cardTitle}" from ${p.fromList} to ${p.toList}.`;
      case 'card_completed':
        return `${userName} marked "${p.cardTitle}" as complete.`;
      case 'card_uncompleted':
        return `${userName} marked "${p.cardTitle}" as incomplete.`;
      case 'card_deleted':
        return `${userName} deleted card "${p.cardTitle}".`;
      case 'comment_added':
        return `${userName} commented on "${p.cardTitle}": "${p.commentText?.slice(0, 40)}..."`;
      default:
        return `${userName} performed an action (${act.type}).`;
    }
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 w-80 bg-menu border-l border-border shadow-2xl flex flex-col text-text-primary animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="history" size={20} className="text-primary" />
          <h3 className="text-sm font-semibold">Board Activity</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-high flex items-center justify-center transition-colors"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-xs text-text-muted">
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-xs text-text-muted">
            No activity recorded yet.
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="flex items-start gap-2.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-surface-container-high text-text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {act.user?.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-text-secondary leading-relaxed">
                  {formatActivityText(act)}
                </p>
                <span className="text-[10px] text-text-muted">
                  {new Date(act.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  •{' '}
                  {new Date(act.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
