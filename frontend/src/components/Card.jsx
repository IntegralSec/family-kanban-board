import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Card.css';

function Card({ card, member, onClick, isDragging }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging
    } = useSortable({
        id: card.id,
        data: {
            type: 'card',
            card
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1
    };

    // Parse date string (YYYY-MM-DD) as local date to avoid timezone issues
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        // Handle both ISO format (YYYY-MM-DDTHH:mm:ss) and date-only (YYYY-MM-DD)
        const dateOnly = dateStr.split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const dueDate = parseLocalDate(card.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrow = new Date(todayDateOnly);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isOverdue = dueDate && dueDate < todayDateOnly;
    
    const isToday = dueDate && 
        dueDate.getTime() === todayDateOnly.getTime();

    const formatDate = (date) => {
        if (!date) return null;
        if (date.getTime() === todayDateOnly.getTime()) {
            return 'Today';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Use member color for the card indicator
    const indicatorColor = member?.color;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`card ${isDragging ? 'card-dragging' : ''} ${card.emoji ? 'card-has-emoji' : ''}`}
            onClick={onClick}
        >
            {/* Color strip at top - matches assigned member's color */}
            {indicatorColor && (
                <div 
                    className="card-indicator"
                    style={{ backgroundColor: indicatorColor }}
                />
            )}

            {/* Emoji positioned on right side */}
            {card.emoji && (
                <span className="card-emoji">{card.emoji}</span>
            )}

            <div className="card-content">
                <h3 className="card-title">{card.title}</h3>

                {card.description && (
                    <p className="card-description">{card.description}</p>
                )}

                {/* Tags */}
                {card.tags && card.tags.length > 0 && (
                    <div className="card-tags">
                        {card.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="card-tag">{tag}</span>
                        ))}
                        {card.tags.length > 3 && (
                            <span className="card-tag card-tag-more">
                                +{card.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Footer with assignee and due date */}
                {(member || card.due_date) && (
                    <div className="card-footer">
                        {member && (
                            <div 
                                className="card-assignee"
                                style={{ '--member-color': member.color }}
                            >
                                <span 
                                    className="assignee-dot"
                                    style={{ backgroundColor: member.color }}
                                />
                                <span className="assignee-name">{member.name}</span>
                            </div>
                        )}
                        {card.due_date && (
                            <div className={`card-due ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''}`}>
                                <span className="due-icon">📅</span>
                                <span className="due-date">{formatDate(dueDate)}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Card;

