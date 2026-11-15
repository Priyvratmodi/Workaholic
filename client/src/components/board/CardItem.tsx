import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardInfo } from '@workaholic/shared';
import { Icon, IconName } from '../ui/Icon.js';
import { getLabelTextColor } from '../../utils/colors.js';

interface CardItemProps {
  card: CardInfo;
  isDragOverlay?: boolean;
  isReadOnly?: boolean;
  onOpenCard?: (cardId: string) => void;
  onToggleComplete?: (cardId: string, current: boolean) => void;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  isDragOverlay = false,
  isReadOnly = false,
  onOpenCard,
  onToggleComplete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
    disabled: isReadOnly || isDragOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  // Due date status
  const getDueDateStatus = (): { label: string; colorClass: string; icon: IconName } | null => {
    if (!card.dueDate) return null;
    if (card.isComplete) {
      return {
        label: new Date(card.dueDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: 'task_alt',
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
        }),
        colorClass: 'bg-red-50 text-red-800 border-red-200 font-semibold',
        icon: 'schedule',
      };
    }
    if (diffHours <= 24) {
      return {
        label: 'Due soon',
        colorClass: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
        icon: 'schedule',
      };
    }
    return {
      label: new Date(card.dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      colorClass: 'bg-surface-container text-text-secondary border-border',
      icon: 'calendar_today',
    };
  };

  const dueDateStatus = getDueDateStatus();

  // Checklist progress
  const totalChecklistItems = card.checklists.reduce(
    (acc, cl) => acc + cl.items.length,
    0
  );
  const doneChecklistItems = card.checklists.reduce(
    (acc, cl) => acc + cl.items.filter((it) => it.isDone).length,
    0
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpenCard?.(card.id)}
      className={`rounded-xl p-3 flex flex-col gap-2.5 transition-all duration-150 select-none group cursor-pointer border ${
        isDragOverlay
          ? 'bg-card border-primary shadow-2xl scale-105 rotate-2 opacity-95 ring-2 ring-primary'
          : isDragging
          ? 'opacity-30 bg-column border-dashed border-primary'
          : 'bg-card hover:bg-card-hover border-border hover:border-primary/60 shadow-xs'
      }`}
    >
      {/* Cover Color Strip or Labels */}
      {card.coverColor && (
        <div
          className="h-2 w-full rounded-md -mt-1"
          style={{ backgroundColor: card.coverColor }}
        />
      )}

      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.labels.map((l) => (
            <span
              key={l.id}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide truncate max-w-[160px]"
              style={{ backgroundColor: l.color, color: getLabelTextColor(l.color) }}
            >
              {l.name || '•'}
            </span>
          ))}
        </div>
      )}

      {/* Title & Quick Complete Checkbox */}
      <div className="flex items-start gap-2">
        {!isReadOnly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete?.(card.id, card.isComplete);
            }}
            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
              card.isComplete
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-text-muted hover:border-primary'
            }`}
            title={card.isComplete ? 'Mark incomplete' : 'Mark complete'}
          >
            {card.isComplete && (
              <Icon name="check" size={13} className="font-bold text-white" />
            )}
          </button>
        )}
        <h4
          className={`text-xs font-medium leading-snug flex-1 transition-colors ${
            card.isComplete
              ? 'line-through text-text-muted'
              : 'text-text-primary group-hover:text-primary'
          }`}
        >
          {card.title}
        </h4>
      </div>

      {/* Badges & Assigned Members Footer */}
      {(dueDateStatus ||
        totalChecklistItems > 0 ||
        (card.commentsCount !== undefined && card.commentsCount > 0) ||
        card.attachments.length > 0 ||
        card.description ||
        card.members.length > 0) && (
        <div className="flex items-center justify-between pt-1 gap-2 text-[11px] text-text-muted">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Due date badge */}
            {dueDateStatus && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] ${dueDateStatus.colorClass}`}
              >
                <Icon name={dueDateStatus.icon} size={12} />
                <span>{dueDateStatus.label}</span>
              </span>
            )}

            {/* Checklist progress badge */}
            {totalChecklistItems > 0 && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] ${
                  doneChecklistItems === totalChecklistItems
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-surface-container text-text-secondary border-border'
                }`}
              >
                <Icon name="check_box" size={12} />
                <span>
                  {doneChecklistItems}/{totalChecklistItems}
                </span>
              </span>
            )}

            {/* Description indicator */}
            {card.description && (
              <span
                className="flex items-center text-text-muted"
                title="This card has a description"
              >
                <Icon name="description" size={14} />
              </span>
            )}

            {/* Comments badge */}
            {card.commentsCount !== undefined && card.commentsCount > 0 && (
              <span
                className="inline-flex items-center gap-1 text-text-muted"
                title={`${card.commentsCount} comments`}
              >
                <Icon name="chat_bubble_outline" size={13} />
                <span>{card.commentsCount}</span>
              </span>
            )}

            {/* Attachments badge */}
            {card.attachments.length > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-text-muted"
                title={`${card.attachments.length} attachments`}
              >
                <Icon name="attach_file" size={13} />
                <span>{card.attachments.length}</span>
              </span>
            )}
          </div>

          {/* Assigned Members */}
          {card.members.length > 0 && (
            <div className="flex items-center -space-x-1 shrink-0">
              {card.members.slice(0, 3).map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center ring-1 ring-card"
                  title={m.name}
                >
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
