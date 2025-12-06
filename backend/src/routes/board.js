import { Router } from 'express';
import xss from 'xss';
import { getBoard, updateBoard, getColumns, getCards, getMembers, exportBoard } from '../db/index.js';

const router = Router();

// Get full board state
router.get('/', (req, res) => {
    try {
        const board = getBoard();
        const columns = getColumns();
        const cards = getCards();
        const members = getMembers();
        
        res.json({
            ...board,
            columns,
            cards,
            members
        });
    } catch (error) {
        console.error('Error fetching board:', error);
        res.status(500).json({ error: 'Failed to fetch board' });
    }
});

// Update board settings
router.put('/', (req, res) => {
    try {
        const { name, theme } = req.body;
        
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        const sanitizedName = xss(name.trim());
        const validTheme = ['light', 'dark'].includes(theme) ? theme : 'light';
        
        const board = updateBoard(sanitizedName, validTheme);
        res.json(board);
    } catch (error) {
        console.error('Error updating board:', error);
        res.status(500).json({ error: 'Failed to update board' });
    }
});

// Export board data
router.get('/export', (req, res) => {
    try {
        const data = exportBoard();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=kanban-export.json');
        res.json(data);
    } catch (error) {
        console.error('Error exporting board:', error);
        res.status(500).json({ error: 'Failed to export board' });
    }
});

export default router;

