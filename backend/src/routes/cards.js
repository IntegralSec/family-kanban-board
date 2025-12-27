import { Router } from 'express';
import xss from 'xss';
import { getCards, createCard, updateCard, deleteCard, reorderCards } from '../db/index.js';

const router = Router();

// Sanitize card input
function sanitizeCardInput(data) {
    return {
        title: data.title ? xss(data.title.trim()) : undefined,
        description: data.description ? xss(data.description.trim()) : data.description,
        columnId: data.columnId,
        assigneeId: data.assigneeId,
        color: data.color ? xss(data.color) : data.color,
        emoji: data.emoji ? xss(data.emoji) : data.emoji,
        tags: Array.isArray(data.tags) ? data.tags.map(t => xss(String(t).trim())) : data.tags,
        dueDate: data.dueDate,
        orderIndex: data.orderIndex
    };
}

// Get all cards
router.get('/', (req, res) => {
    try {
        const cards = getCards();
        res.json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

// Create a new card
router.post('/', (req, res) => {
    try {
        const { columnId, title, description, assigneeId, color, emoji, tags, dueDate, orderIndex } = req.body;
        
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        if (!columnId) {
            return res.status(400).json({ error: 'Column ID is required' });
        }
        
        const sanitized = sanitizeCardInput(req.body);
        const cards = getCards().filter(c => c.column_id === columnId);
        const order = typeof orderIndex === 'number' ? orderIndex : cards.length;
        
        const card = createCard(
            columnId,
            sanitized.title,
            sanitized.description,
            assigneeId,
            sanitized.color,
            sanitized.emoji,
            sanitized.tags || [],
            dueDate,
            order
        );
        
        res.status(201).json(card);
    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

// Update a card
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const sanitized = sanitizeCardInput(req.body);
        
        const card = updateCard(parseInt(id), sanitized);
        res.json(card);
    } catch (error) {
        console.error('Error updating card:', error);
        if (error.message === 'Card not found') {
            return res.status(404).json({ error: 'Card not found' });
        }
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// Reorder cards (for drag-and-drop) - must come before /:id route
router.post('/reorder', (req, res) => {
    try {
        const { orders } = req.body;
        
        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: 'Orders must be an array' });
        }
        
        reorderCards(orders);
        const cards = getCards();
        res.json(cards);
    } catch (error) {
        console.error('Error reordering cards:', error);
        res.status(500).json({ error: 'Failed to reorder cards' });
    }
});

// Delete a card
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        deleteCard(parseInt(id));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

export default router;

