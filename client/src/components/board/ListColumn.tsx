import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ListInfo } from '@workaholic/shared';
import { CardItem } from './CardItem.js';

interface ListColumnProps {
  list: ListInfo;
  isReadOnly?: boolean;
  onOpenCard?: (cardId: string) => void;
  onToggleComplete?: (cardId: string, current: boolean) => Promise<any> | void;
  onAddCard?: (listId: string, title: string) => Promise<any>;
  onUpdateListTitle?: (listId: string, newTitle: string) => Promise<any>;
  onDeleteList?: (listId: string) => Promise<any>;
}

export const ListColumn: React.FC<ListColumnProps> = ({
  list,
  isReadOnly = false,
  onOpenCard,
  onToggleComplete,
  onAddCard,
  onUpdateListTitle,
  onDeleteList,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardTitleInput, setCardTitleInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cardInputRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
      className={`w-[272px] shrink-0 bg-[#22272B] rounded-2xl p-2.5 flex flex-col gap-2.5 shadow-md border max-h-[calc(100vh-140px)] transition-colors ${
        isOver ? 'border-[#579DFF] bg-[#22272B]/90' : 'border-[#38414A]/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 pt-1 relative">
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
              className="bg-[#1D2125] text-white text-xs font-semibold px-1.5 py-0.5 rounded border border-[#579DFF] w-full focus:outline-none"
            />
          ) : (
            <h3
              onClick={() => !isReadOnly && setIsEditingTitle(true)}
              className={`text-xs font-semibold text-white tracking-tight truncate ${
                !isReadOnly ? 'cursor-pointer hover:text-[#579DFF]' : ''
              }`}
              title={list.title}
            >
              {list.title}
            </h3>
          )}

          <span className="px-1.5 py-0.2 rounded-full bg-[#2C333A] text-[#8C9BAB] text-[10px] font-bold shrink-0">
            {list.cards.length}
          </span>
        </div>

        {/* Column Menu */}
        {!isReadOnly && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-6 h-6 rounded flex items-center justify-center text-[#8C9BAB] hover:text-white hover:bg-[#2C333A] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                more_horiz
              </span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 rounded-xl bg-[#22272B] border border-[#38414A] shadow-xl py-1 z-30 animate-in fade-in duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsEditingTitle(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#B6C2CF] hover:bg-[#2C333A] hover:text-white flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  <span>Rename list</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAddingCard(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#B6C2CF] hover:bg-[#2C333A] hover:text-white flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add card</span>
                </button>
                <div className="h-px bg-[#38414A] my-1"></div>
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
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-[#2C333A] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
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
          <div className="min-h-[70px] rounded-xl border border-dashed border-[#38414A]/70 flex items-center justify-center text-center p-3">
            <span className="text-[11px] text-[#8C9BAB]">No tasks here yet</span>
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
                className="w-full px-2.5 py-2 rounded-xl bg-[#1D2125] text-white placeholder-[#8C9BAB] text-xs border border-[#38414A] focus:border-[#579DFF] focus:outline-none resize-none shadow-inner"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#579DFF] hover:bg-[#85B8FF] text-[#1D2125] text-xs font-semibold transition-colors"
                >
                  Add card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCard(false);
                    setCardTitleInput('');
                  }}
                  className="w-7 h-7 rounded-lg text-[#8C9BAB] hover:text-white hover:bg-[#2C333A] flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingCard(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[#B6C2CF] hover:text-white hover:bg-[#2C333A] transition-colors text-xs font-medium text-left"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add a card</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
