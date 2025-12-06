import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import Card from './Card';
import './Column.css';

function Column({ column, cards, members, selectedMember, onAddCard, onCardClick, getMember, isHighlighted }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const { setNodeRef } = useDroppable({
        id: `column-${column.id}`,
        data: {
            type: 'column',
            column
        }
    });

    const handleAddCard = async () => {
        if (newTitle.trim()) {
            // If a member is selected in the filter, assign them to the new card
            const cardData = selectedMember ? { assigneeId: selectedMember } : {};
            await onAddCard(column.id, newTitle.trim(), cardData);
            setNewTitle('');
            setIsAdding(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddCard();
        } else if (e.key === 'Escape') {
            setNewTitle('');
            setIsAdding(false);
        }
    };

    const isDoneColumn = column.title.toLowerCase() === 'done';

    return (
        <div 
            ref={setNodeRef}
            className={`column ${isHighlighted ? 'column-over' : ''} ${isDoneColumn ? 'column-done' : ''}`}
        >
            <div className="column-header">
                <h2 className="column-title">
                    {column.title}
                    <span className="column-count">{cards.length}</span>
                </h2>
            </div>

            <div className="column-content">
                <SortableContext
                    items={cards.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {cards.map(card => (
                        <Card
                            key={card.id}
                            card={card}
                            member={getMember(card.assignee_id)}
                            onClick={() => onCardClick(card)}
                        />
                    ))}
                </SortableContext>

                {isAdding ? (
                    <div className="add-card-form animate-scaleIn">
                        <input
                            type="text"
                            placeholder="Card title..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        <div className="add-card-actions">
                            <button 
                                className="btn-add"
                                onClick={handleAddCard}
                            >
                                Add
                            </button>
                            <button 
                                className="btn-cancel"
                                onClick={() => {
                                    setNewTitle('');
                                    setIsAdding(false);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        className="add-card-btn"
                        onClick={() => setIsAdding(true)}
                    >
                        <span className="add-icon">+</span>
                        Add card
                    </button>
                )}
            </div>
        </div>
    );
}

export default Column;

