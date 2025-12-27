import express from 'express';
import cors from 'cors';
import { unlinkSync, existsSync } from 'fs';
import { initDatabase } from '../db/index.js';
import boardRoutes from '../routes/board.js';
import columnsRoutes from '../routes/columns.js';
import cardsRoutes from '../routes/cards.js';
import membersRoutes from '../routes/members.js';

/**
 * Get the test database path
 */
export function getTestDbPath() {
  return process.env.DATA_PATH || '/tmp/kanban-test.db';
}

/**
 * Clean up database files
 */
export function cleanupDatabase(dbPath) {
  if (!dbPath) {
    dbPath = getTestDbPath();
  }
  if (existsSync(dbPath)) {
    try {
      unlinkSync(dbPath);
    } catch (err) {
      // Ignore errors if file is locked
    }
  }
  // Also clean up WAL and SHM files
  const walPath = dbPath + '-wal';
  const shmPath = dbPath + '-shm';
  if (existsSync(walPath)) {
    try {
      unlinkSync(walPath);
    } catch (err) {}
  }
  if (existsSync(shmPath)) {
    try {
      unlinkSync(shmPath);
    } catch (err) {}
  }
}

/**
 * Clean up test database before all tests (call this in beforeAll)
 */
export function setupTestDatabase() {
  cleanupDatabase(getTestDbPath());
}

/**
 * Clean up test database after all tests (call this in afterAll)
 */
export function teardownTestDatabase() {
  cleanupDatabase(getTestDbPath());
}

/**
 * Create a test Express app instance
 * This is used by Supertest to make HTTP requests
 */
export function createTestApp() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Initialize test database (will create/use test database from setup.js)
  // The database is cleaned up in global-setup.js beforeAll/afterAll
  initDatabase();
  
  // API routes
  app.use('/api/board', boardRoutes);
  app.use('/api/columns', columnsRoutes);
  app.use('/api/cards', cardsRoutes);
  app.use('/api/members', membersRoutes);
  
  // Export endpoint (alias)
  app.get('/api/export', (req, res) => {
    res.redirect('/api/board/export');
  });
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  return app;
}

/**
 * Helper to wait for async operations
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

