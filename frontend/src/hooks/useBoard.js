import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api';
const POLL_INTERVAL = 5000; // 5 seconds

export function useBoard() {
    const [board, setBoard] = useState(null);
    const [columns, setColumns] = useState([]);
    const [cards, setCards] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMounted = useRef(true);

    // Fetch all board data
    const fetchBoard = useCallback(async (isPolling = false) => {
        try {
            const response = await fetch(`${API_BASE}/board`);
            if (!response.ok) throw new Error('Failed to fetch board');
            const data = await response.json();
            
            if (isMounted.current) {
                setBoard({ id: data.id, name: data.name, theme: data.theme });
                setColumns(data.columns || []);
                setCards(data.cards || []);
                setMembers(data.members || []);
                setError(null);
            }
        } catch (err) {
            // Only log errors on initial load, not during polling
            if (!isPolling) {
                console.error('Error fetching board:', err);
                if (isMounted.current) {
                    setError(err.message);
                }
            }
        } finally {
            if (isMounted.current && !isPolling) {
                setLoading(false);
            }
        }
    }, []);

    // Initial fetch and polling setup
    useEffect(() => {
        isMounted.current = true;
        
        // Initial fetch
        fetchBoard(false);
        
        // Set up polling interval
        const pollInterval = setInterval(() => {
            fetchBoard(true);
        }, POLL_INTERVAL);

        // Cleanup on unmount
        return () => {
            isMounted.current = false;
            clearInterval(pollInterval);
        };
    }, [fetchBoard]);

    // Board operations
    const updateBoard = async (name, theme) => {
        const response = await fetch(`${API_BASE}/board`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, theme })
        });
        if (!response.ok) throw new Error('Failed to update board');
        const data = await response.json();
        setBoard(data);
        return data;
    };

    // Column operations
    const addColumn = async (title) => {
        const response = await fetch(`${API_BASE}/columns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, orderIndex: columns.length })
        });
        if (!response.ok) throw new Error('Failed to add column');
        const column = await response.json();
        setColumns(prev => [...prev, column]);
        return column;
    };

    const updateColumn = async (id, title, orderIndex) => {
        const response = await fetch(`${API_BASE}/columns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, orderIndex })
        });
        if (!response.ok) throw new Error('Failed to update column');
        const column = await response.json();
        setColumns(prev => prev.map(c => c.id === id ? column : c));
        return column;
    };

    const deleteColumn = async (id) => {
        const response = await fetch(`${API_BASE}/columns/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete column');
        }
        setColumns(prev => prev.filter(c => c.id !== id));
        setCards(prev => prev.filter(c => c.column_id !== id));
    };

    const reorderColumns = async (orders) => {
        const response = await fetch(`${API_BASE}/columns/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders })
        });
        if (!response.ok) throw new Error('Failed to reorder columns');
        const newColumns = await response.json();
        setColumns(newColumns);
    };

    // Card operations
    const addCard = async (columnId, title, data = {}) => {
        const columnCards = cards.filter(c => c.column_id === columnId);
        const response = await fetch(`${API_BASE}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                columnId,
                title,
                orderIndex: columnCards.length,
                ...data
            })
        });
        if (!response.ok) throw new Error('Failed to add card');
        const card = await response.json();
        setCards(prev => [...prev, card]);
        return card;
    };

    const updateCard = async (id, updates) => {
        const response = await fetch(`${API_BASE}/cards/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update card');
        const card = await response.json();
        setCards(prev => prev.map(c => c.id === id ? card : c));
        return card;
    };

    const deleteCard = async (id) => {
        const response = await fetch(`${API_BASE}/cards/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete card');
        setCards(prev => prev.filter(c => c.id !== id));
    };

    const reorderCards = async (orders) => {
        const response = await fetch(`${API_BASE}/cards/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders })
        });
        if (!response.ok) throw new Error('Failed to reorder cards');
        const newCards = await response.json();
        setCards(newCards);
    };

    // Member operations
    const addMember = async (name, color) => {
        const response = await fetch(`${API_BASE}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color })
        });
        if (!response.ok) throw new Error('Failed to add member');
        const member = await response.json();
        setMembers(prev => [...prev, member]);
        return member;
    };

    const updateMember = async (id, name, color) => {
        const response = await fetch(`${API_BASE}/members/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color })
        });
        if (!response.ok) throw new Error('Failed to update member');
        const member = await response.json();
        setMembers(prev => prev.map(m => m.id === id ? member : m));
        return member;
    };

    const deleteMember = async (id) => {
        const response = await fetch(`${API_BASE}/members/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete member');
        setMembers(prev => prev.filter(m => m.id !== id));
    };

    // Export
    const exportBoard = () => {
        window.open(`${API_BASE}/board/export`, '_blank');
    };

    return {
        board,
        columns,
        cards,
        members,
        loading,
        error,
        refresh: fetchBoard,
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
    };
}

