import { useState, useEffect } from 'react';
import './Modal.css';
import './Settings.css';

const MEMBER_COLORS = [
    '#e07a5f', '#f2a65a', '#f2cc8f', '#81b29a', 
    '#6b9ac4', '#9b8bc4', '#d4a5a5', '#84a98c'
];

function SettingsModal({ 
    board, 
    columns, 
    members, 
    onUpdateBoard, 
    onAddColumn,
    onUpdateColumn,
    onDeleteColumn,
    onAddMember, 
    onUpdateMember, 
    onDeleteMember,
    onExport,
    onClose 
}) {
    const [boardName, setBoardName] = useState(board?.name || '');
    const [theme, setTheme] = useState(board?.theme || 'light');
    const [editingColumn, setEditingColumn] = useState(null);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [editingMember, setEditingMember] = useState(null);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberColor, setNewMemberColor] = useState(MEMBER_COLORS[0]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleSaveBoard = async () => {
        if (boardName.trim()) {
            await onUpdateBoard(boardName.trim(), theme);
        }
    };

    const handleAddColumn = async () => {
        if (newColumnTitle.trim()) {
            await onAddColumn(newColumnTitle.trim());
            setNewColumnTitle('');
        }
    };

    const handleUpdateColumn = async (column) => {
        if (editingColumn?.title?.trim()) {
            await onUpdateColumn(column.id, editingColumn.title.trim(), column.order_index);
            setEditingColumn(null);
        }
    };

    const handleDeleteColumn = async (id) => {
        if (columns.length > 1) {
            try {
                await onDeleteColumn(id);
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const handleAddMember = async () => {
        if (newMemberName.trim()) {
            await onAddMember(newMemberName.trim(), newMemberColor);
            setNewMemberName('');
            setNewMemberColor(MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)]);
        }
    };

    const handleUpdateMember = async (member) => {
        if (editingMember?.name?.trim()) {
            await onUpdateMember(member.id, editingMember.name.trim(), editingMember.color);
            setEditingMember(null);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const sortedColumns = [...columns].sort((a, b) => a.order_index - b.order_index);

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal modal-large animate-scaleIn">
                <div className="modal-header">
                    <h2>⚙️ Settings</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content settings-content">
                    {/* Board Settings */}
                    <section className="settings-section">
                        <h3>Board</h3>
                        <div className="form-group">
                            <label htmlFor="board-name">Board Name</label>
                            <div className="input-with-action">
                                <input
                                    id="board-name"
                                    type="text"
                                    value={boardName}
                                    onChange={(e) => setBoardName(e.target.value)}
                                    placeholder="Board name"
                                />
                                <button 
                                    className="btn-primary"
                                    onClick={handleSaveBoard}
                                    disabled={!boardName.trim()}
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Theme</label>
                            <div className="theme-picker">
                                <button
                                    className={`theme-btn theme-light ${theme === 'light' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setTheme('light');
                                        onUpdateBoard(boardName, 'light');
                                    }}
                                >
                                    ☀️ Light
                                </button>
                                <button
                                    className={`theme-btn theme-dark ${theme === 'dark' ? 'selected' : ''}`}
                                    onClick={() => {
                                        setTheme('dark');
                                        onUpdateBoard(boardName, 'dark');
                                    }}
                                >
                                    🌙 Dark
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Columns */}
                    <section className="settings-section">
                        <h3>Columns</h3>
                        <div className="settings-list">
                            {sortedColumns.map(column => (
                                <div key={column.id} className="settings-item">
                                    {editingColumn?.id === column.id ? (
                                        <div className="inline-edit">
                                            <input
                                                type="text"
                                                value={editingColumn.title}
                                                onChange={(e) => setEditingColumn({ 
                                                    ...editingColumn, 
                                                    title: e.target.value 
                                                })}
                                                autoFocus
                                            />
                                            <button 
                                                className="btn-icon"
                                                onClick={() => handleUpdateColumn(column)}
                                            >
                                                ✓
                                            </button>
                                            <button 
                                                className="btn-icon"
                                                onClick={() => setEditingColumn(null)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="item-name">{column.title}</span>
                                            <div className="item-actions">
                                                <button 
                                                    className="btn-icon"
                                                    onClick={() => setEditingColumn({ 
                                                        id: column.id, 
                                                        title: column.title 
                                                    })}
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className="btn-icon btn-icon-danger"
                                                    onClick={() => handleDeleteColumn(column.id)}
                                                    disabled={columns.length <= 1}
                                                    title={columns.length <= 1 ? 'Cannot delete last column' : 'Delete column'}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="add-item-form">
                            <input
                                type="text"
                                value={newColumnTitle}
                                onChange={(e) => setNewColumnTitle(e.target.value)}
                                placeholder="New column name"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                            />
                            <button 
                                className="btn-primary"
                                onClick={handleAddColumn}
                                disabled={!newColumnTitle.trim()}
                            >
                                Add Column
                            </button>
                        </div>
                    </section>

                    {/* Family Members */}
                    <section className="settings-section">
                        <h3>Family Members</h3>
                        <div className="settings-list">
                            {members.map(member => (
                                <div key={member.id} className="settings-item">
                                    {editingMember?.id === member.id ? (
                                        <div className="inline-edit member-edit">
                                            <div className="color-picker-mini">
                                                {MEMBER_COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        className={`color-btn-mini ${editingMember.color === c ? 'selected' : ''}`}
                                                        style={{ backgroundColor: c }}
                                                        onClick={() => setEditingMember({ 
                                                            ...editingMember, 
                                                            color: c 
                                                        })}
                                                    />
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                value={editingMember.name}
                                                onChange={(e) => setEditingMember({ 
                                                    ...editingMember, 
                                                    name: e.target.value 
                                                })}
                                            />
                                            <button 
                                                className="btn-icon"
                                                onClick={() => handleUpdateMember(member)}
                                            >
                                                ✓
                                            </button>
                                            <button 
                                                className="btn-icon"
                                                onClick={() => setEditingMember(null)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="member-info">
                                                <span 
                                                    className="member-dot-large"
                                                    style={{ backgroundColor: member.color }}
                                                />
                                                <span className="item-name">{member.name}</span>
                                            </div>
                                            <div className="item-actions">
                                                <button 
                                                    className="btn-icon"
                                                    onClick={() => setEditingMember({ 
                                                        id: member.id, 
                                                        name: member.name,
                                                        color: member.color
                                                    })}
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className="btn-icon btn-icon-danger"
                                                    onClick={() => onDeleteMember(member.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {members.length === 0 && (
                                <p className="empty-message">No family members added yet</p>
                            )}
                        </div>
                        <div className="add-item-form member-add">
                            <div className="color-picker-mini">
                                {MEMBER_COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={`color-btn-mini ${newMemberColor === c ? 'selected' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setNewMemberColor(c)}
                                    />
                                ))}
                            </div>
                            <input
                                type="text"
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                placeholder="New member name"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                            />
                            <button 
                                className="btn-primary"
                                onClick={handleAddMember}
                                disabled={!newMemberName.trim()}
                            >
                                Add Member
                            </button>
                        </div>
                    </section>

                    {/* Export */}
                    <section className="settings-section">
                        <h3>Data</h3>
                        <button className="btn-secondary export-btn" onClick={onExport}>
                            📥 Export Board Data (JSON)
                        </button>
                    </section>
                </div>

                <div className="modal-footer">
                    <button className="btn-primary" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsModal;

