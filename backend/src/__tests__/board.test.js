import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp, cleanupDatabase } from '../__testUtils__/helpers.js';
import { initDatabase, getBoard, updateBoard } from '../db/index.js';

describe('Board API', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  describe('GET /api/board', () => {
    it('should return full board state with columns, cards, and members', async () => {
      const response = await request(app)
        .get('/api/board')
        .expect(200);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('theme');
      expect(response.body).toHaveProperty('columns');
      expect(response.body).toHaveProperty('cards');
      expect(response.body).toHaveProperty('members');
      expect(Array.isArray(response.body.columns)).toBe(true);
      expect(Array.isArray(response.body.cards)).toBe(true);
      expect(Array.isArray(response.body.members)).toBe(true);
    });
    
    it('should include default columns', async () => {
      const response = await request(app)
        .get('/api/board')
        .expect(200);
      
      expect(response.body.columns.length).toBeGreaterThan(0);
      const columnTitles = response.body.columns.map(c => c.title);
      expect(columnTitles).toContain('Backlog');
    });
  });
  
  describe('PUT /api/board', () => {
    it('should update board name and theme', async () => {
      const response = await request(app)
        .put('/api/board')
        .send({
          name: 'Test Board',
          theme: 'dark'
        })
        .expect(200);
      
      expect(response.body.name).toBe('Test Board');
      expect(response.body.theme).toBe('dark');
    });
    
    it('should update only name when theme is not provided', async () => {
      const response = await request(app)
        .put('/api/board')
        .send({
          name: 'Updated Board Name'
        })
        .expect(200);
      
      expect(response.body.name).toBe('Updated Board Name');
    });
    
    it('should sanitize XSS in board name', async () => {
      const response = await request(app)
        .put('/api/board')
        .send({
          name: '<script>alert("xss")</script>Test',
          theme: 'light'
        })
        .expect(200);
      
      expect(response.body.name).not.toContain('<script>');
      expect(response.body.name).toContain('Test');
    });
    
    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .put('/api/board')
        .send({
          theme: 'dark'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Name is required');
    });
    
    it('should return 400 if name is not a string', async () => {
      const response = await request(app)
        .put('/api/board')
        .send({
          name: 123,
          theme: 'dark'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should default to light theme if invalid theme provided', async () => {
      const response = await request(app)
        .put('/api/board')
        .send({
          name: 'Test Board',
          theme: 'invalid'
        })
        .expect(200);
      
      expect(response.body.theme).toBe('light');
    });
  });
  
  describe('GET /api/board/export', () => {
    it('should export board data as JSON', async () => {
      const response = await request(app)
        .get('/api/board/export')
        .expect(200);
      
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('kanban-export.json');
      
      expect(response.body).toHaveProperty('board');
      expect(response.body).toHaveProperty('columns');
      expect(response.body).toHaveProperty('cards');
      expect(response.body).toHaveProperty('members');
      expect(response.body).toHaveProperty('exportedAt');
    });
  });
  
  describe('GET /api/board/download-db', () => {
    it('should download database file', async () => {
      const response = await request(app)
        .get('/api/board/download-db')
        .expect(200);
      
      expect(response.headers['content-type']).toBe('application/x-sqlite3');
      expect(response.headers['content-disposition']).toBeDefined();
      expect(response.headers['content-disposition']).toContain('attachment');
      const contentLength = parseInt(response.headers['content-length']);
      expect(contentLength).toBeGreaterThan(0);
      // Supertest returns body - verify it's not empty
      expect(response.body).toBeDefined();
      // For binary content, body should be a Buffer or have a length property
      if (Buffer.isBuffer(response.body)) {
        expect(response.body.length).toBeGreaterThan(0);
      } else if (typeof response.body === 'string') {
        expect(response.body.length).toBeGreaterThan(0);
      } else {
        // If it's parsed as an object, that's also acceptable for binary data
        expect(response.body).toBeTruthy();
      }
    });
  });
  
  describe('GET /api/export', () => {
    it('should redirect to /api/board/export', async () => {
      const response = await request(app)
        .get('/api/export')
        .expect(302);
      
      expect(response.headers.location).toBe('/api/board/export');
    });
  });
});

