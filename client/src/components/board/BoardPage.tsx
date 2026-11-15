import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { BoardBundle, CardInfo, getPositionBetween } from '@workaholic/shared';
import { fetchBoardById, updateBoard, starBoard, unstarBoard } from '../../api/boards.js';
import { createList, updateList, deleteList } from '../../api/lists.js';
import { createCard, updateCard } from '../../api/cards.js';
import { BoardHeader } from './BoardHeader.js';
import { ListColumn } from './ListColumn.js';
import { CardItem } from './CardItem.js';
import { ActivityDrawer } from './ActivityDrawer.js';
import { CardModal } from '../card-modal/CardModal.js';
import { ShareModal } from '../share/ShareModal.js';
import { AISummaryModal } from './AISummaryModal.js';
import { getBackgroundClass } from '../../utils/backgrounds.js';
import { Icon } from '../ui/Icon.js';

export const BoardPage: React.FC = () => {
  const { id: boardId, cardId } = useParams<{ id: string; cardId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchFilter, setSearchFilter] = useState('');
  const [activeCard, setActiveCard] = useState<CardInfo | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  // Fetch board bundle
  const {
    data: board,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => fetchBoardById(boardId!),
    enabled: !!boardId,
  });

  const isReadOnly = board?.userRole === 'viewer';

  // Pointer sensor with distance constraint so click opens card modal without dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Helper to update board in cache
  const setBoardCache = useCallback(
    (updater: (old: BoardBundle) => BoardBundle) => {
      queryClient.setQueryData<BoardBundle>(['board', boardId], (old) => {
        if (!old) return old;
        return updater(old);
      });
    },
    [queryClient, boardId]
  );

  // Star Toggle Mutation
  const toggleStarMutation = useMutation({
    mutationFn: async () => {
      if (!board) return;
      if (board.isStarred) {
        await unstarBoard(board.id);
      } else {
        await starBoard(board.id);
      }
    },
    onMutate: () => {
      setBoardCache((old) => ({ ...old, isStarred: !old.isStarred }));
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Rename Board Mutation
  const updateTitleMutation = useMutation({
    mutationFn: (newTitle: string) => updateBoard(boardId!, { title: newTitle }),
    onMutate: (newTitle) => {
      setBoardCache((old) => ({ ...old, title: newTitle }));
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Create List Mutation
  const addListMutation = useMutation({
    mutationFn: (title: string) => createList(boardId!, { title }),
    onSuccess: (newList) => {
      setBoardCache((old) => ({
        ...old,
        lists: [...old.lists, newList],
      }));
      setNewListTitle('');
      setIsAddingList(false);
    },
  });

  // Update List Title Mutation
  const updateListTitleMutation = useMutation({
    mutationFn: ({ listId, newTitle }: { listId: string; newTitle: string }) =>
      updateList(listId, { title: newTitle }),
    onMutate: ({ listId, newTitle }) => {
      setBoardCache((old) => ({
        ...old,
        lists: old.lists.map((l) =>
          l.id === listId ? { ...l, title: newTitle } : l
        ),
      }));
    },
  });

  // Delete List Mutation
  const deleteListMutation = useMutation({
    mutationFn: (listId: string) => deleteList(listId),
    onMutate: (listId) => {
      setBoardCache((old) => ({
        ...old,
        lists: old.lists.filter((l) => l.id !== listId),
      }));
    },
  });

  // Update List Color Mutation
  const updateListColorMutation = useMutation({
    mutationFn: ({ listId, color }: { listId: string; color: string | null }) =>
      updateList(listId, { color }),
    onMutate: ({ listId, color }) => {
      setBoardCache((old) => ({
        ...old,
        lists: old.lists.map((l) =>
          l.id === listId ? { ...l, color } : l
        ),
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Create Card Mutation
  const addCardMutation = useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      createCard(listId, { title }),
    onSuccess: (newCard) => {
      setBoardCache((old) => ({
        ...old,
        lists: old.lists.map((l) =>
          l.id === newCard.listId
            ? { ...l, cards: [...l.cards, newCard] }
            : l
        ),
      }));
    },
  });

  // Toggle Card Complete Mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: ({ cardId, current }: { cardId: string; current: boolean }) =>
      updateCard(cardId, { isComplete: !current }),
    onMutate: ({ cardId, current }) => {
      setBoardCache((old) => ({
        ...old,
        lists: old.lists.map((l) => ({
          ...l,
          cards: l.cards.map((c) =>
            c.id === cardId ? { ...c, isComplete: !current } : c
          ),
        })),
      }));
    },
  });

  // Card Movement Mutation (Fractional Indexing: exactly 1 card updated!)
  const moveCardMutation = useMutation({
    mutationFn: ({
      cardId,
      listId,
      position,
    }: {
      cardId: string;
      listId: string;
      position: string;
    }) => updateCard(cardId, { listId, position }),
    onError: (_err, _vars, context: any) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', boardId], context.previousBoard);
      } else {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      }
    },
  });

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    if (isReadOnly) return;
    const { active } = event;
    const card = active.data.current?.card as CardInfo | undefined;
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (isReadOnly || !board) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find lists
    const activeList = board.lists.find((l) =>
      l.cards.some((c) => c.id === activeId)
    );
    // Over target can be a card or a list column directly
    const overList =
      board.lists.find((l) => l.cards.some((c) => c.id === overId)) ||
      board.lists.find((l) => l.id === overId);

    if (!activeList || !overList) return;

    if (activeList.id !== overList.id) {
      setBoardCache((old) => {
        const sourceList = old.lists.find((l) => l.id === activeList.id)!;
        const targetList = old.lists.find((l) => l.id === overList.id)!;

        const activeCardObj = sourceList.cards.find((c) => c.id === activeId)!;
        const overIndex = targetList.cards.findIndex((c) => c.id === overId);

        const newTargetCards = [...targetList.cards];
        if (overIndex >= 0) {
          newTargetCards.splice(overIndex, 0, {
            ...activeCardObj,
            listId: targetList.id,
          });
        } else {
          newTargetCards.push({
            ...activeCardObj,
            listId: targetList.id,
          });
        }

        return {
          ...old,
          lists: old.lists.map((l) => {
            if (l.id === sourceList.id) {
              return {
                ...l,
                cards: l.cards.filter((c) => c.id !== activeId),
              };
            }
            if (l.id === targetList.id) {
              return {
                ...l,
                cards: newTargetCards,
              };
            }
            return l;
          }),
        };
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    if (isReadOnly || !board) return;

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find list containing activeId
    const currentList = board.lists.find((l) =>
      l.cards.some((c) => c.id === activeId)
    );
    if (!currentList) return;

    const activeIndex = currentList.cards.findIndex((c) => c.id === activeId);
    let overIndex = currentList.cards.findIndex((c) => c.id === overId);
    if (overIndex < 0) {
      overIndex = currentList.cards.length - 1;
    }

    let targetCards = [...currentList.cards];
    if (activeIndex !== overIndex) {
      targetCards = arrayMove(targetCards, activeIndex, overIndex);
      setBoardCache((old) => ({
        ...old,
        lists: old.lists.map((l) =>
          l.id === currentList.id ? { ...l, cards: targetCards } : l
        ),
      }));
    }

    // Calculate new fractional index position
    const finalIndex = targetCards.findIndex((c) => c.id === activeId);
    const prevCard = finalIndex > 0 ? targetCards[finalIndex - 1] : null;
    const nextCard =
      finalIndex < targetCards.length - 1 ? targetCards[finalIndex + 1] : null;

    const newPosition = getPositionBetween(prevCard?.position, nextCard?.position);

    // Persist single card movement to server
    moveCardMutation.mutate({
      cardId: activeId,
      listId: currentList.id,
      position: newPosition,
    });
  };

  // Filter cards by search filter
  const filteredLists = useMemo(() => {
    if (!board) return [];
    if (!searchFilter.trim()) return board.lists;

    const query = searchFilter.toLowerCase();
    return board.lists.map((l) => ({
      ...l,
      cards: l.cards.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.labels.some((lbl) => lbl.name?.toLowerCase().includes(query))
      ),
    }));
  }, [board, searchFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-text-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-text-muted">Loading board...</span>
        </div>
      </div>
    );
  }

  if (isError || !board) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-text-primary p-4">
        <div className="p-6 rounded-2xl bg-surface-container border border-red-900/50 max-w-md w-full flex flex-col gap-3 text-center">
          <Icon name="error" size={36} className="text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-text-primary">Board Not Found</h2>
          <p className="text-xs text-text-muted">
            {(error as any)?.message ||
              'This board does not exist or you do not have permission to view it.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/boards')}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-canvas font-semibold text-xs"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const bgClass = getBackgroundClass(board.background);

  return (
    <div className={`min-h-screen flex flex-col ${bgClass} select-none`}>
      {/* Board Header */}
      <BoardHeader
        board={board}
        searchFilter={searchFilter}
        onSearchChange={setSearchFilter}
        onToggleStar={() => toggleStarMutation.mutate()}
        onUpdateTitle={(newTitle) => updateTitleMutation.mutateAsync(newTitle)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenAISummary={() => setIsAISummaryOpen(true)}
        onToggleActivity={() => setIsActivityOpen(!isActivityOpen)}
        isActivityOpen={isActivityOpen}
      />

      {/* Kanban Board Canvas */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className="flex-1 overflow-x-auto p-6 min-h-[calc(100vh-56px)] flex items-start gap-4">
          {filteredLists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              isReadOnly={isReadOnly}
              onOpenCard={(cardId) => navigate(`/boards/${board.id}/cards/${cardId}`)}
              onToggleComplete={(cardId, current) =>
                toggleCompleteMutation.mutateAsync({ cardId, current })
              }
              onAddCard={(listId, title) =>
                addCardMutation.mutateAsync({ listId, title })
              }
              onUpdateListTitle={(listId, newTitle) =>
                updateListTitleMutation.mutateAsync({ listId, newTitle })
              }
              onUpdateListColor={(listId, color) =>
                updateListColorMutation.mutateAsync({ listId, color })
              }
              onDeleteList={(listId) => deleteListMutation.mutateAsync(listId)}
            />
          ))}

          {/* Add Another List Column */}
          {!isReadOnly && (
            <div className="w-[272px] shrink-0">
              {isAddingList ? (
                <div className="bg-column rounded-2xl p-3 border border-border flex flex-col gap-2.5 shadow-md">
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newListTitle.trim()) {
                        addListMutation.mutate(newListTitle.trim());
                      }
                      if (e.key === 'Escape') {
                        setIsAddingList(false);
                        setNewListTitle('');
                      }
                    }}
                    placeholder="Enter list title..."
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl bg-surface-container text-text-primary placeholder:text-text-muted text-xs border border-border focus:border-primary focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!newListTitle.trim()}
                      onClick={() => {
                        if (newListTitle.trim()) {
                          addListMutation.mutate(newListTitle.trim());
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-canvas text-xs font-semibold transition-colors disabled:opacity-60"
                    >
                      Add list
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingList(false);
                        setNewListTitle('');
                      }}
                      className="w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-high flex items-center justify-center transition-colors"
                    >
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingList(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-column/80 hover:bg-column border border-dashed border-border hover:border-primary/60 text-text-secondary hover:text-text-primary transition-all text-xs font-semibold backdrop-blur-sm shadow-sm"
                >
                  <Icon name="add" size={18} />
                  <span>{board.lists.length === 0 ? 'Add a list' : 'Add another list'}</span>
                </button>
              )}
            </div>
          )}
        </main>

        {/* Drag Overlay with 3-degree tilt and shadow lift */}
        <DragOverlay>
          {activeCard ? <CardItem card={activeCard} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Activity Drawer */}
      <ActivityDrawer
        boardId={board.id}
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />

      {/* Card Detail Modal (Deep-linked) */}
      {cardId && (
        <CardModal
          cardId={cardId}
          board={board}
          onClose={() => navigate(`/boards/${board.id}`)}
        />
      )}

      {/* Share Board Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        board={board}
        onMembersChanged={() => {
          queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        }}
      />

      {/* AI Board Summary Modal */}
      <AISummaryModal
        isOpen={isAISummaryOpen}
        onClose={() => setIsAISummaryOpen(false)}
        boardId={board.id}
        boardTitle={board.title}
        onCardClick={(cardId) => navigate(`/boards/${board.id}/cards/${cardId}`)}
      />
    </div>
  );
};
