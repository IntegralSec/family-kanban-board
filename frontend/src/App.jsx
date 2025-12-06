import { useState, useEffect } from 'react';
import { useBoard } from './hooks/useBoard';
import TopBar from './components/TopBar';
import Board from './components/Board';
import CardModal from './components/CardModal';
import SettingsModal from './components/SettingsModal';
import './styles/App.css';

function App() {
    const {
        board,
        columns,
        cards,
        members,
        loading,
        error,
        updateBoard,
        addColumn,
        updateColumn,
        deleteColumn,
        reorderColumns,
        addCard,
        updateCard,
        deleteCard,
        reorderCards,
        addMember,
        updateMember,
        deleteMember,
        exportBoard
    } = useBoard();

    const [selectedMember, setSelectedMember] = useState(null);
    const [showTodayOnly, setShowTodayOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingCard, setEditingCard] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    // Apply theme
    useEffect(() => {
        if (board?.theme) {
            document.documentElement.setAttribute('data-theme', board.theme);
        }
    }, [board?.theme]);

    // Filter cards based on member, today filter, and search
    const getFilteredCards = () => {
        let filtered = [...cards];

        // Filter by member
        if (selectedMember) {
            filtered = filtered.filter(c => c.assignee_id === selectedMember);
        }

        // Filter by today
        if (showTodayOnly) {
            const today = new Date().toISOString().split('T')[0];
            const todayColumn = columns.find(c => 
                c.title.toLowerCase() === 'today'
            );
            filtered = filtered.filter(c => 
                c.due_date?.startsWith(today) || 
                (todayColumn && c.column_id === todayColumn.id)
            );
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.title.toLowerCase().includes(query) ||
                c.description?.toLowerCase().includes(query) ||
                c.tags?.some(t => t.toLowerCase().includes(query))
            );
        }

        return filtered;
    };

    const handleCardClick = (card) => {
        setEditingCard(card);
    };

    const handleCardSave = async (cardData) => {
        if (editingCard.id) {
            await updateCard(editingCard.id, cardData);
        }
        setEditingCard(null);
    };

    const handleCardDelete = async () => {
        if (editingCard?.id) {
            await deleteCard(editingCard.id);
            setEditingCard(null);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading your board...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <div className="error-icon">⚠️</div>
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                    Try Again
                </button>
            </div>
        );
    }

    const filteredCards = getFilteredCards();

    return (
        <div className="app">
            <TopBar
                boardName={board?.name || 'Family Kanban'}
                members={members}
                selectedMember={selectedMember}
                onMemberChange={setSelectedMember}
                showTodayOnly={showTodayOnly}
                onTodayToggle={() => setShowTodayOnly(!showTodayOnly)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSettingsClick={() => setShowSettings(true)}
            />
            
            <Board
                columns={columns}
                cards={filteredCards}
                members={members}
                selectedMember={selectedMember}
                onAddCard={addCard}
                onCardClick={handleCardClick}
                onReorderCards={reorderCards}
                onReorderColumns={reorderColumns}
            />

            {editingCard && (
                <CardModal
                    card={editingCard}
                    members={members}
                    onSave={handleCardSave}
                    onDelete={handleCardDelete}
                    onClose={() => setEditingCard(null)}
                />
            )}

            {showSettings && (
                <SettingsModal
                    board={board}
                    columns={columns}
                    members={members}
                    onUpdateBoard={updateBoard}
                    onAddColumn={addColumn}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                    onAddMember={addMember}
                    onUpdateMember={updateMember}
                    onDeleteMember={deleteMember}
                    onExport={exportBoard}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
}

export default App;

