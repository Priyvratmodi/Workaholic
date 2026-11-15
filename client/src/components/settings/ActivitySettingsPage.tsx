import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client.js';
import { Icon } from '../ui/Icon.js';

interface ActivityItem {
  id: string;
  type: string;
  payload: any;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export const ActivitySettingsPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        const res = await apiRequest<{ activities: ActivityItem[] }>('/api/users/me/activity');
        setActivities(res.activities || []);
      } catch (e) {
        console.error('Failed to load activity:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadActivity();
  }, []);

  const formatActivityMessage = (act: ActivityItem) => {
    switch (act.type) {
      case 'CARD_CREATE':
        return `Created card "${act.payload?.cardTitle || 'Untitled Card'}"`;
      case 'CARD_UPDATE':
        return `Updated card "${act.payload?.cardTitle || 'Untitled Card'}"`;
      case 'CARD_MOVE':
        return `Moved card "${act.payload?.cardTitle || 'Untitled Card'}"`;
      case 'CARD_DELETE':
        return `Deleted card "${act.payload?.cardTitle || 'Card'}"`;
      case 'COMMENT_CREATE':
        return `Commented on card "${act.payload?.cardTitle || 'Card'}"`;
      case 'CHECKLIST_TOGGLE':
        return `Toggled checklist item on "${act.payload?.cardTitle || 'Card'}"`;
      default:
        return `Performed ${act.type.toLowerCase().replace(/_/g, ' ')}`;
    }
  };

  return (
    <div className="bg-surface-container-low rounded-2xl p-6 border border-border shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            Your Recent Activity
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Audit history of your actions, comments, and task updates across all boards.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container border border-border text-text-muted font-semibold">
          {activities.length} Events
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-14 rounded-xl bg-surface-container border border-border animate-pulse"
            ></div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="p-8 rounded-xl bg-surface-container/40 border border-dashed border-border text-center flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-surface-container text-text-muted flex items-center justify-center">
            <Icon name="history" size={20} />
          </div>
          <span className="text-xs font-semibold text-text-secondary">No recent activity found</span>
          <p className="text-[11px] text-text-muted">
            Actions you perform on boards and cards will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container border border-border/80 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name="history" size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-text-primary">
                    {formatActivityMessage(act)}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
