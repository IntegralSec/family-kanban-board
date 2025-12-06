import { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    pointerWithin,
    rectIntersection,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import Column from './Column';
import Card from './Card';
import './Board.css';

function Board({ 
    columns, 
    cards, 
    members,
    selectedMember,
    onAddCard, 
    onCardClick, 
    onReorderCards,
    onReorderColumns
}) {
    const [activeCard, setActiveCard] = useState(null);
    const [overColumnId, setOverColumnId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 8
            }
        })
    );

    const sortedColumns = [...columns].sort((a, b) => a.order_index - b.order_index);

    // Custom collision detection that works better for columns
    const collisionDetection = (args) => {
        // First check if pointer is within any droppable
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }
        // Fallback to rect intersection for edge cases
        return rectIntersection(args);
    };

    const getColumnCards = (columnId) => {
        return cards
            .filter(c => c.column_id === columnId)
            .sort((a, b) => a.order_index - b.order_index);
    };

    const getMember = (memberId) => {
        return members.find(m => m.id === memberId);
    };

    const handleDragStart = (event) => {
        const { active } = event;
        if (active.data.current?.type === 'card') {
            setActiveCard(active.data.current.card);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveCard(null);
        setOverColumnId(null);

        if (!over) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        if (activeType === 'card') {
            const activeCard = active.data.current.card;
            let targetColumnId = activeCard.column_id;
            let targetIndex = 0;

            // Determine target column and position
            if (overType === 'column') {
                targetColumnId = over.data.current.column.id;
                const columnCards = getColumnCards(targetColumnId);
                targetIndex = columnCards.length;
            } else if (overType === 'card') {
                const overCard = over.data.current.card;
                targetColumnId = overCard.column_id;
                const columnCards = getColumnCards(targetColumnId);
                targetIndex = columnCards.findIndex(c => c.id === overCard.id);
            }

            // Build new order
            const allCards = [...cards];
            const cardToMove = allCards.find(c => c.id === activeCard.id);
            
            if (cardToMove) {
                // Remove from current position
                const filteredCards = allCards.filter(c => c.id !== activeCard.id);
                
                // Get cards in target column
                const targetColumnCards = filteredCards
                    .filter(c => c.column_id === targetColumnId)
                    .sort((a, b) => a.order_index - b.order_index);

                // Insert at new position
                targetColumnCards.splice(targetIndex, 0, { ...cardToMove, column_id: targetColumnId });

                // Build order updates
                const orders = targetColumnCards.map((card, index) => ({
                    id: card.id,
                    columnId: targetColumnId,
                    orderIndex: index
                }));

                // Also update other cards in original column if different
                if (activeCard.column_id !== targetColumnId) {
                    const originalColumnCards = filteredCards
                        .filter(c => c.column_id === activeCard.column_id)
                        .sort((a, b) => a.order_index - b.order_index);
                    
                    originalColumnCards.forEach((card, index) => {
                        orders.push({
                            id: card.id,
                            columnId: activeCard.column_id,
                            orderIndex: index
                        });
                    });
                }

                onReorderCards(orders);
            }
        }
    };

    const handleDragOver = (event) => {
        const { over } = event;
        
        if (!over) {
            setOverColumnId(null);
            return;
        }

        // Determine which column is being hovered over
        const overType = over.data.current?.type;
        
        if (overType === 'column') {
            setOverColumnId(over.data.current.column.id);
        } else if (overType === 'card') {
            // If hovering over a card, highlight that card's column
            setOverColumnId(over.data.current.card.column_id);
        }
    };

    return (
        <div className="board">
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
            >
                <SortableContext
                    items={sortedColumns.map(c => c.id)}
                    strategy={horizontalListSortingStrategy}
                >
                    <div className="columns-container">
                        {sortedColumns.map(column => (
                            <Column
                                key={column.id}
                                column={column}
                                cards={getColumnCards(column.id)}
                                members={members}
                                selectedMember={selectedMember}
                                onAddCard={onAddCard}
                                onCardClick={onCardClick}
                                getMember={getMember}
                                isHighlighted={overColumnId === column.id && activeCard !== null}
                            />
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay dropAnimation={null}>
                    {activeCard && (
                        <Card
                            card={activeCard}
                            member={getMember(activeCard.assignee_id)}
                            isDragging
                        />
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

export default Board;

