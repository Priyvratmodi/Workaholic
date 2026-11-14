import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardInfo } from '@workaholic/shared';

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
  const getDueDateStatus = () => {
    if (!card.dueDate) return null;
    if (card.isComplete) {
      return {
        label: new Date(card.dueDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        colorClass: 'bg-[#4BCE97]/20 text-[#4BCE97] border-[#4BCE97]/40',
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
        colorClass: 'bg-[#F87168]/20 text-[#F87168] border-[#F87168]/40 font-semibold',
        icon: 'schedule',
      };
    }
    if (diffHours <= 24) {
      return {
        label: 'Due soon',
        colorClass: 'bg-[#F5CD47]/20 text-[#F5CD47] border-[#F5CD47]/40 font-medium',
        icon: 'schedule',
      };
    }
    return {
      label: new Date(card.dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      colorClass: 'bg-[#2C333A] text-[#B6C2CF] border-[#38414A]',
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
          ? 'bg-[#2C333A] border-[#579DFF] shadow-2xl scale-105 rotate-2 opacity-95 ring-2 ring-[#579DFF]'
          : isDragging
          ? 'opacity-30 bg-[#22272B] border-dashed border-[#579DFF]'
          : 'bg-[#2C333A] hover:bg-[#333B44] border-[#38414A]/80 hover:border-[#579DFF]/60 shadow-sm'
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
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white tracking-wide truncate max-w-[160px]"
              style={{ backgroundColor: l.color }}
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
                ? 'bg-[#4BCE97] border-[#4BCE97] text-[#1D2125]'
                : 'border-[#8C9BAB] hover:border-[#579DFF] text-transparent'
            }`}
            title={card.isComplete ? 'Mark incomplete' : 'Mark complete'}
          >
            <span className="material-symbols-outlined text-[13px] font-bold">
              check
            </span>
          </button>
        )}
        <h4
          className={`text-xs font-medium leading-snug flex-1 transition-colors ${
            card.isComplete
              ? 'line-through text-[#8C9BAB]'
              : 'text-white group-hover:text-[#85B8FF]'
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
        <div className="flex items-center justify-between pt-1 gap-2 text-[11px] text-[#8C9BAB]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Due date badge */}
            {dueDateStatus && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] ${dueDateStatus.colorClass}`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {dueDateStatus.icon}
                </span>
                <span>{dueDateStatus.label}</span>
              </span>
            )}

            {/* Checklist progress badge */}
            {totalChecklistItems > 0 && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] ${
                  doneChecklistItems === totalChecklistItems
                    ? 'bg-[#4BCE97]/20 text-[#4BCE97] border-[#4BCE97]/40'
                    : 'bg-[#22272B] text-[#B6C2CF] border-[#38414A]'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  check_box
                </span>
                <span>
                  {doneChecklistItems}/{totalChecklistItems}
                </span>
              </span>
            )}

            {/* Description indicator */}
            {card.description && (
              <span
                className="flex items-center text-[#8C9BAB]"
                title="This card has a description"
              >
                <span className="material-symbols-outlined text-[14px]">
                  description
                </span>
              </span>
            )}

            {/* Comments badge */}
            {card.commentsCount !== undefined && card.commentsCount > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[#8C9BAB]"
                title={`${card.commentsCount} comments`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  chat_bubble_outline
                </span>
                <span>{card.commentsCount}</span>
              </span>
            )}

            {/* Attachments badge */}
            {card.attachments.length > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-[#8C9BAB]"
                title={`${card.attachments.length} attachments`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  attach_file
                </span>
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
                  className="w-5 h-5 rounded-full bg-[#579DFF]/20 text-[#579DFF] text-[9px] font-bold flex items-center justify-center ring-1 ring-[#2C333A]"
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
