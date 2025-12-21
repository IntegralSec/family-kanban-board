import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_PATH = process.env.DATA_PATH || '/data/board.db';

export function getDatabasePath() {
    return DATA_PATH;
}

let db;

export function initDatabase() {
    try {
        db = new Database(DATA_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        
        // Read and execute schema
        const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
        db.exec(schema);
        
        console.log(`Database initialized at ${DATA_PATH}`);
        return db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

export function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

// Board operations
export function getBoard() {
    const board = getDb().prepare('SELECT * FROM board WHERE id = 1').get();
    return board;
}

export function updateBoard(name, theme) {
    const stmt = getDb().prepare(`
        UPDATE board SET name = ?, theme = ?, updated_at = datetime('now') WHERE id = 1
    `);
    stmt.run(name, theme);
    return getBoard();
}

// Column operations
export function getColumns() {
    return getDb().prepare('SELECT * FROM columns ORDER BY order_index').all();
}

export function createColumn(title, orderIndex) {
    const stmt = getDb().prepare(`
        INSERT INTO columns (board_id, title, order_index) VALUES (1, ?, ?)
    `);
    const result = stmt.run(title, orderIndex);
    return getDb().prepare('SELECT * FROM columns WHERE id = ?').get(result.lastInsertRowid);
}

export function updateColumn(id, title, orderIndex) {
    const stmt = getDb().prepare(`
        UPDATE columns SET title = ?, order_index = ?, updated_at = datetime('now') WHERE id = ?
    `);
    stmt.run(title, orderIndex, id);
    return getDb().prepare('SELECT * FROM columns WHERE id = ?').get(id);
}

export function deleteColumn(id) {
    // Don't allow deletion if it's the last column
    const count = getDb().prepare('SELECT COUNT(*) as count FROM columns').get().count;
    if (count <= 1) {
        throw new Error('Cannot delete the last column');
    }
    getDb().prepare('DELETE FROM columns WHERE id = ?').run(id);
}

export function reorderColumns(columnOrders) {
    const stmt = getDb().prepare('UPDATE columns SET order_index = ? WHERE id = ?');
    const transaction = getDb().transaction((orders) => {
        for (const { id, orderIndex } of orders) {
            stmt.run(orderIndex, id);
        }
    });
    transaction(columnOrders);
}

// Card operations
export function getCards() {
    return getDb().prepare('SELECT * FROM cards ORDER BY order_index').all().map(card => ({
        ...card,
        tags: JSON.parse(card.tags || '[]')
    }));
}

export function createCard(columnId, title, description, assigneeId, color, emoji, tags, dueDate, orderIndex) {
    const stmt = getDb().prepare(`
        INSERT INTO cards (board_id, column_id, title, description, assignee_id, color, emoji, tags, due_date, order_index)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
        columnId, 
        title, 
        description || null, 
        assigneeId || null, 
        color || null, 
        emoji || null, 
        JSON.stringify(tags || []), 
        dueDate || null, 
        orderIndex
    );
    const card = getDb().prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);
    return { ...card, tags: JSON.parse(card.tags || '[]') };
}

export function updateCard(id, updates) {
    const card = getDb().prepare('SELECT * FROM cards WHERE id = ?').get(id);
    if (!card) {
        throw new Error('Card not found');
    }
    
    const stmt = getDb().prepare(`
        UPDATE cards SET 
            column_id = ?, title = ?, description = ?, assignee_id = ?, 
            color = ?, emoji = ?, tags = ?, due_date = ?, order_index = ?,
            updated_at = datetime('now')
        WHERE id = ?
    `);
    
    stmt.run(
        updates.columnId ?? card.column_id,
        updates.title ?? card.title,
        updates.description ?? card.description,
        updates.assigneeId ?? card.assignee_id,
        updates.color ?? card.color,
        updates.emoji ?? card.emoji,
        JSON.stringify(updates.tags ?? JSON.parse(card.tags || '[]')),
        updates.dueDate ?? card.due_date,
        updates.orderIndex ?? card.order_index,
        id
    );
    
    const updated = getDb().prepare('SELECT * FROM cards WHERE id = ?').get(id);
    return { ...updated, tags: JSON.parse(updated.tags || '[]') };
}

export function deleteCard(id) {
    getDb().prepare('DELETE FROM cards WHERE id = ?').run(id);
}

export function reorderCards(cardOrders) {
    const stmt = getDb().prepare('UPDATE cards SET column_id = ?, order_index = ? WHERE id = ?');
    const transaction = getDb().transaction((orders) => {
        for (const { id, columnId, orderIndex } of orders) {
            stmt.run(columnId, orderIndex, id);
        }
    });
    transaction(cardOrders);
}

// Member operations
export function getMembers() {
    return getDb().prepare('SELECT * FROM members ORDER BY name').all();
}

export function createMember(name, color, avatar) {
    const stmt = getDb().prepare(`
        INSERT INTO members (name, color, avatar) VALUES (?, ?, ?)
    `);
    const result = stmt.run(name, color || '#6366f1', avatar || null);
    return getDb().prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
}

export function updateMember(id, name, color, avatar) {
    const stmt = getDb().prepare(`
        UPDATE members SET name = ?, color = ?, avatar = ?, updated_at = datetime('now') WHERE id = ?
    `);
    stmt.run(name, color, avatar, id);
    return getDb().prepare('SELECT * FROM members WHERE id = ?').get(id);
}

export function deleteMember(id) {
    getDb().prepare('DELETE FROM members WHERE id = ?').run(id);
}

// Export full board data
export function exportBoard() {
    const board = getBoard();
    const columns = getColumns();
    const cards = getCards();
    const members = getMembers();
    
    return {
        board,
        columns,
        cards,
        members,
        exportedAt: new Date().toISOString()
    };
}

// Create a complete database backup (includes WAL checkpoint)
// This checkpoints the WAL file to ensure all data is in the main database file
export function createDatabaseBackup() {
    const sourceDb = getDb();
    
    // Checkpoint the WAL to merge all changes into the main database file
    // This ensures the downloaded file contains all data
    sourceDb.pragma('wal_checkpoint(TRUNCATE)');
    
    // Now read the main database file which contains all data
    const dbPath = getDatabasePath();
    return readFileSync(dbPath);
}

