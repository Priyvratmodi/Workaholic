import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { Icon } from '../ui/Icon.js';

interface AssignedCard {
  id: string;
  listId: string;
  listTitle: string;
  title: string;
  description: string | null;
  startDate: string | null;
  dueDate: string | null;
  isComplete: boolean;
  labels: { id: string; name: string | null; color: string }[];
  checklistsCount: number;
  checklistsCompletedCount: number;
  checklistsTotalItems: number;
}

interface BoardGroup {
  board: {
    id: string;
    title: string;
    background: string;
  };
  cards: AssignedCard[];
}

export const CardsSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [groupedCards, setGroupedCards] = useState<BoardGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCards() {
      try {
        const res = await apiRequest<{ groupedCards: BoardGroup[] }>('/api/users/me/cards');
        setGroupedCards(res.groupedCards || []);
      } catch (e) {
        console.error('Failed to load assigned cards:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadCards();
  }, []);

  const totalCards = groupedCards.reduce((acc, bg) => acc + bg.cards.length, 0);

  return (
    <div className="bg-surface-container-low rounded-2xl p-6 border border-border shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            Your Assigned Cards
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Overview of deliverables and cards assigned to you across all active boards.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container border border-border text-text-muted font-semibold">
          {totalCards} Assigned
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-28 rounded-xl bg-surface-container border border-border animate-pulse"
            ></div>
          ))}
        </div>
      ) : groupedCards.length === 0 ? (
        <div className="p-8 rounded-xl bg-surface-container/40 border border-dashed border-border text-center flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-surface-container text-text-muted flex items-center justify-center">
            <Icon name="task_alt" size={20} />
          </div>
          <span className="text-xs font-semibold text-text-secondary">No cards assigned to you</span>
          <p className="text-[11px] text-text-muted">
            When team members assign you to cards, they will appear here grouped by board.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedCards.map(({ board, cards }) => (
            <div
              key={board.id}
              className="rounded-2xl border border-border bg-surface-container p-4 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    <Icon name="view_kanban" size={14} />
                  </div>
                  <h3 className="text-xs font-bold text-text-primary">{board.title}</h3>
                  <span className="text-[11px] text-text-muted">
                    ({cards.length} {cards.length === 1 ? 'card' : 'cards'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open board</span>
                  <Icon name="arrow_forward" size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cards.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/boards/${board.id}`)}
                    className="p-3 rounded-xl bg-card hover:bg-card-hover border border-border/80 hover:border-primary/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2"
                  >
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        {c.listTitle}
                      </span>
                      <h4 className="text-xs font-semibold text-text-primary leading-snug line-clamp-2">
                        {c.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/40">
                      {c.dueDate ? (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[10px]">
                          <Icon name="schedule" size={13} />
                          <span>{new Date(c.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </span>
                      ) : (
                        <span>No due date</span>
                      )}

                      {c.checklistsTotalItems > 0 && (
                        <span className="flex items-center gap-1">
                          <Icon name="check_box" size={13} />
                          <span>
                            {c.checklistsCompletedCount}/{c.checklistsTotalItems}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
