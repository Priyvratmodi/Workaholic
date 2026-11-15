import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ListInfo } from '@workaholic/shared';
import { CardItem } from './CardItem.js';
import { Icon } from '../ui/Icon.js';
import { LIST_COLOR_PRESETS, getListColorPreset } from '../../utils/colors.js';

interface ListColumnProps {
  list: ListInfo;
  isReadOnly?: boolean;
  onOpenCard?: (cardId: string) => void;
  onToggleComplete?: (cardId: string, current: boolean) => Promise<any> | void;
  onAddCard?: (listId: string, title: string) => Promise<any>;
  onUpdateListTitle?: (listId: string, newTitle: string) => Promise<any>;
  onUpdateListColor?: (listId: string, color: string | null) => Promise<any>;
  onDeleteList?: (listId: string) => Promise<any>;
}

export const ListColumn: React.FC<ListColumnProps> = ({
  list,
  isReadOnly = false,
  onOpenCard,
  onToggleComplete,
  onAddCard,
  onUpdateListTitle,
  onUpdateListColor,
  onDeleteList,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardTitleInput, setCardTitleInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cardInputRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  const colorPreset = getListColorPreset(list.color);

  // Droppable zone for list container (handles empty list drops)
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
    disabled: isReadOnly,
  });

  useEffect(() => {
    if (isAddingCard) {
      cardInputRef.current?.focus();
    }
  }, [isAddingCard]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput.trim() !== list.title) {
      await onUpdateListTitle?.(list.id, titleInput.trim());
    } else {
      setTitleInput(list.title);
    }
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitleInput.trim()) return;

    const newTitle = cardTitleInput.trim();
    setCardTitleInput('');
    setIsAddingCard(false);
    await onAddCard?.(list.id, newTitle);
  };

  const cardIds = list.cards.map((c) => c.id);

  return (
    <div
      className={`w-[272px] shrink-0 rounded-2xl p-2.5 flex flex-col gap-2.5 shadow-md border max-h-[calc(100vh-140px)] transition-all ${
        colorPreset.bgClass
      } ${
        isOver ? 'border-primary ring-2 ring-primary/20' : colorPreset.borderClass
      }`}
    >
      {/* Top Accent Strip when custom color is applied */}
      {colorPreset.color && (
        <div className={`h-1.5 w-full rounded-full ${colorPreset.accentBarClass} -mt-0.5 mb-0.5`} />
      )}

      {/* Column Header */}
      <div className={`flex items-center justify-between px-1.5 pt-1 relative ${colorPreset.headerClass}`}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {list.emoji && (
            <span className="text-base select-none shrink-0">{list.emoji}</span>
          )}

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
                  setTitleInput(list.title);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-canvas text-text-primary text-xs font-semibold px-1.5 py-0.5 rounded border border-primary w-full focus:outline-none"
            />
          ) : (
            <h3
              onClick={() => !isReadOnly && setIsEditingTitle(true)}
              className={`text-xs font-semibold text-text-primary tracking-tight truncate ${
                !isReadOnly ? 'cursor-pointer hover:text-primary' : ''
              }`}
              title={list.title}
            >
              {list.title}
            </h3>
          )}

          <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-text-muted text-[10px] font-bold shrink-0">
            {list.cards.length}
          </span>
        </div>

        {/* Column Menu */}
        {!isReadOnly && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-container-high transition-colors"
            >
              <Icon name="more_horiz" size={16} />
            </button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-1 w-48 rounded-xl bg-menu border border-border shadow-xl py-1.5 z-30 animate-in fade-in duration-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsEditingTitle(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-container-high hover:text-text-primary flex items-center gap-2"
                >
                  <Icon name="edit" size={14} />
                  <span>Rename list</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAddingCard(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-container-high hover:text-text-primary flex items-center gap-2"
                >
                  <Icon name="add" size={14} />
                  <span>Add card</span>
                </button>

                <div className="h-px bg-border my-1"></div>

                <div className="px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  List Color
                </div>
                <div className="grid grid-cols-4 gap-1.5 px-3 py-1 pb-1.5">
                  {LIST_COLOR_PRESETS.map((preset) => {
                    const isSelected = (list.color || null) === preset.color;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.name}
                        onClick={async () => {
                          setIsMenuOpen(false);
                          await onUpdateListColor?.(list.id, preset.color);
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110 shadow-xs border ${
                          isSelected ? 'ring-2 ring-primary ring-offset-1 border-primary' : 'border-border/60'
                        }`}
                        style={{ backgroundColor: preset.dotColor }}
                      >
                        {isSelected && (
                          <Icon name="check" size={14} className="text-white font-bold" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="h-px bg-border my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (
                      window.confirm(
                        `Are you sure you want to delete "${list.title}" and its ${list.cards.length} cards?`
                      )
                    ) {
                      onDeleteList?.(list.id);
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <Icon name="delete" size={14} className="text-red-500" />
                  <span>Delete list</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards List with Sortable Context */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 overflow-y-auto pr-0.5 min-h-[50px] flex-1"
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {list.cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              isReadOnly={isReadOnly}
              onOpenCard={onOpenCard}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </SortableContext>

        {list.cards.length === 0 && (
          <div className="min-h-[70px] rounded-xl border border-dashed border-border flex items-center justify-center text-center p-3">
            <span className="text-[11px] text-text-muted">No tasks here yet</span>
          </div>
        )}
      </div>

      {/* Column Footer: Inline Card Composer */}
      {!isReadOnly && (
        <div className="pt-1">
          {isAddingCard ? (
            <form onSubmit={handleCardSubmit} className="flex flex-col gap-2">
              <textarea
                ref={cardInputRef}
                value={cardTitleInput}
                onChange={(e) => setCardTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCardSubmit(e);
                  }
                  if (e.key === 'Escape') {
                    setIsAddingCard(false);
                    setCardTitleInput('');
                  }
                }}
                placeholder="Enter a title for this card..."
                rows={2}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas text-text-primary placeholder:text-text-muted text-xs border border-border focus:border-primary focus:outline-none resize-none shadow-inner"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-canvas text-xs font-semibold transition-colors"
                >
                  Add card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCard(false);
                    setCardTitleInput('');
                  }}
                  className="w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-high flex items-center justify-center transition-colors"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingCard(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-container-high transition-colors text-xs font-medium text-left"
            >
              <Icon name="add" size={16} />
              <span>Add a card</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
