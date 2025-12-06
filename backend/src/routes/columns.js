import { Router } from 'express';
import xss from 'xss';
import { getColumns, createColumn, updateColumn, deleteColumn, reorderColumns } from '../db/index.js';

const router = Router();

// Get all columns
router.get('/', (req, res) => {
    try {
        const columns = getColumns();
        res.json(columns);
    } catch (error) {
        console.error('Error fetching columns:', error);
        res.status(500).json({ error: 'Failed to fetch columns' });
    }
});

// Create a new column
router.post('/', (req, res) => {
    try {
        const { title, orderIndex } = req.body;
        
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const sanitizedTitle = xss(title.trim());
        const columns = getColumns();
        const order = typeof orderIndex === 'number' ? orderIndex : columns.length;
        
        const column = createColumn(sanitizedTitle, order);
        res.status(201).json(column);
    } catch (error) {
        console.error('Error creating column:', error);
        res.status(500).json({ error: 'Failed to create column' });
    }
});

// Update a column
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title, orderIndex } = req.body;
        
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const sanitizedTitle = xss(title.trim());
        const column = updateColumn(parseInt(id), sanitizedTitle, orderIndex);
        
        if (!column) {
            return res.status(404).json({ error: 'Column not found' });
        }
        
        res.json(column);
    } catch (error) {
        console.error('Error updating column:', error);
        res.status(500).json({ error: 'Failed to update column' });
    }
});

// Delete a column
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        deleteColumn(parseInt(id));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting column:', error);
        if (error.message === 'Cannot delete the last column') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to delete column' });
    }
});

// Reorder columns
router.post('/reorder', (req, res) => {
    try {
        const { orders } = req.body;
        
        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: 'Orders must be an array' });
        }
        
        reorderColumns(orders);
        const columns = getColumns();
        res.json(columns);
    } catch (error) {
        console.error('Error reordering columns:', error);
        res.status(500).json({ error: 'Failed to reorder columns' });
    }
});

export default router;

