-- Board table (single board per household)
CREATE TABLE IF NOT EXISTS board (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL DEFAULT 'Family Kanban',
    theme TEXT NOT NULL DEFAULT 'light',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Columns table
CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE
);

-- Members table (family members)
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL DEFAULT 1,
    column_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id INTEGER,
    color TEXT,
    emoji TEXT,
    tags TEXT DEFAULT '[]',
    due_date TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Insert default board if not exists
INSERT OR IGNORE INTO board (id, name, theme) VALUES (1, 'Family Kanban', 'light');

-- Insert default columns if board is empty
INSERT OR IGNORE INTO columns (id, board_id, title, order_index) VALUES 
    (1, 1, 'Backlog', 0),
    (2, 1, 'Today', 1),
    (3, 1, 'In Progress', 2),
    (4, 1, 'Done', 3);

