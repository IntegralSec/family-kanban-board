import { useState, useEffect } from 'react';
import './Modal.css';

const EMOJIS = ['📋', '🏠', '🛒', '💰', '🍳', '🧹', '📚', '💪', '🎉', '⭐', '❤️', '🔧'];

function CardModal({ card, members, onSave, onDelete, onClose }) {
    const [title, setTitle] = useState(card.title || '');
    const [description, setDescription] = useState(card.description || '');
    const [assigneeId, setAssigneeId] = useState(card.assignee_id || '');
    const [emoji, setEmoji] = useState(card.emoji || '');
    const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.split('T')[0] : '');
    const [tags, setTags] = useState((card.tags || []).join(', '));
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        // Prevent background scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleSave = () => {
        if (!title.trim()) return;

        onSave({
            title: title.trim(),
            description: description.trim() || null,
            assigneeId: assigneeId || null,
            emoji: emoji || null,
            dueDate: dueDate || null,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        });
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal animate-scaleIn">
                <div className="modal-header">
                    <h2>Edit Card</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content">
                    <div className="form-group">
                        <label htmlFor="card-title">Title *</label>
                        <input
                            id="card-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Card title"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="card-description">Description</label>
                        <textarea
                            id="card-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="card-assignee">Assignee</label>
                        <select
                            id="card-assignee"
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value ? parseInt(e.target.value) : '')}
                        >
                            <option value="">None</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="card-due">Due Date</label>
                        <input
                            id="card-due"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Emoji</label>
                        <div className="emoji-picker">
                            <button
                                className={`emoji-btn ${!emoji ? 'selected' : ''}`}
                                onClick={() => setEmoji('')}
                            >
                                ✕
                            </button>
                            {EMOJIS.map(e => (
                                <button
                                    key={e}
                                    className={`emoji-btn ${emoji === e ? 'selected' : ''}`}
                                    onClick={() => setEmoji(e)}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="card-tags">Tags (comma separated)</label>
                        <input
                            id="card-tags"
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="urgent, shopping, homework"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    {!showDeleteConfirm ? (
                        <>
                            <button 
                                className="btn-delete"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                🗑️ Delete
                            </button>
                            <div className="footer-actions">
                                <button className="btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button 
                                    className="btn-primary"
                                    onClick={handleSave}
                                    disabled={!title.trim()}
                                >
                                    Save
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="delete-confirm">
                            <span>Delete this card?</span>
                            <button 
                                className="btn-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-danger"
                                onClick={onDelete}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CardModal;

