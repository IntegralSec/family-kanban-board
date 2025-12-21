import { Router } from 'express';
import xss from 'xss';
import { existsSync } from 'fs';
import { basename } from 'path';
import { getBoard, updateBoard, getColumns, getCards, getMembers, exportBoard, getDatabasePath, createDatabaseBackup } from '../db/index.js';

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

// Download database file
router.get('/download-db', (req, res) => {
    try {
        const dbPath = getDatabasePath();
        
        if (!existsSync(dbPath)) {
            return res.status(404).json({ error: 'Database file not found' });
        }
        
        // Create a complete backup that includes WAL checkpoint
        // This ensures all data is included in the downloaded file
        const dbFile = createDatabaseBackup();
        const filename = basename(dbPath) || 'board.db';
        
        res.setHeader('Content-Type', 'application/x-sqlite3');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Length', dbFile.length);
        res.send(dbFile);
    } catch (error) {
        console.error('Error downloading database:', error);
        res.status(500).json({ error: 'Failed to download database' });
    }
});

export default router;

