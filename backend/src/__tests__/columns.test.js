import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp, cleanupDatabase } from '../__testUtils__/helpers.js';
import { getColumns, createColumn, deleteColumn } from '../db/index.js';

describe('Columns API', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  describe('GET /api/columns', () => {
    it('should return all columns ordered by orderIndex', async () => {
      const response = await request(app)
        .get('/api/columns')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify ordering
      for (let i = 0; i < response.body.length - 1; i++) {
        expect(response.body[i].order_index).toBeLessThanOrEqual(
          response.body[i + 1].order_index
        );
      }
    });
    
    it('should return columns with required fields', async () => {
      const response = await request(app)
        .get('/api/columns')
        .expect(200);
      
      if (response.body.length > 0) {
        const column = response.body[0];
        expect(column).toHaveProperty('id');
        expect(column).toHaveProperty('board_id');
        expect(column).toHaveProperty('title');
        expect(column).toHaveProperty('order_index');
        expect(column).toHaveProperty('created_at');
        expect(column).toHaveProperty('updated_at');
      }
    });
  });
  
  describe('POST /api/columns', () => {
    it('should create a new column', async () => {
      const response = await request(app)
        .post('/api/columns')
        .send({
          title: 'Test Column',
          orderIndex: 10
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Column');
      expect(response.body.order_index).toBe(10);
    });
    
    it('should default orderIndex to end if not provided', async () => {
      const getResponse = await request(app)
        .get('/api/columns')
        .expect(200);
      
      const initialCount = getResponse.body.length;
      
      const response = await request(app)
        .post('/api/columns')
        .send({
          title: 'New Column'
        })
        .expect(201);
      
      expect(response.body.order_index).toBe(initialCount);
    });
    
    it('should sanitize XSS in column title', async () => {
      const response = await request(app)
        .post('/api/columns')
        .send({
          title: '<script>alert("xss")</script>Test Column'
        })
        .expect(201);
      
      expect(response.body.title).not.toContain('<script>');
      expect(response.body.title).toContain('Test Column');
    });
    
    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/columns')
        .send({
          orderIndex: 5
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Title is required');
    });
    
    it('should return 400 if title is not a string', async () => {
      const response = await request(app)
        .post('/api/columns')
        .send({
          title: 123
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /api/columns/:id', () => {
    it('should update column title and order', async () => {
      // First create a column
      const createResponse = await request(app)
        .post('/api/columns')
        .send({
          title: 'Original Title',
          orderIndex: 0
        })
        .expect(201);
      
      const columnId = createResponse.body.id;
      
      // Then update it
      const updateResponse = await request(app)
        .put(`/api/columns/${columnId}`)
        .send({
          title: 'Updated Title',
          orderIndex: 5
        })
        .expect(200);
      
      expect(updateResponse.body.title).toBe('Updated Title');
      expect(updateResponse.body.order_index).toBe(5);
    });
    
    it('should return 404 if column not found', async () => {
      const response = await request(app)
        .put('/api/columns/99999')
        .send({
          title: 'Updated Title',
          orderIndex: 0
        })
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Column not found');
    });
    
    it('should return 400 if title is missing', async () => {
      const createResponse = await request(app)
        .post('/api/columns')
        .send({
          title: 'Test Column'
        })
        .expect(201);
      
      const columnId = createResponse.body.id;
      
      const response = await request(app)
        .put(`/api/columns/${columnId}`)
        .send({
          orderIndex: 5
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('DELETE /api/columns/:id', () => {
    it('should delete a column', async () => {
      // Create a column
      const createResponse = await request(app)
        .post('/api/columns')
        .send({
          title: 'To Delete'
        })
        .expect(201);
      
      const columnId = createResponse.body.id;
      
      // Delete it
      await request(app)
        .delete(`/api/columns/${columnId}`)
        .expect(204);
      
      // Verify it's gone
      const getResponse = await request(app)
        .get('/api/columns')
        .expect(200);
      
      const deletedColumn = getResponse.body.find(c => c.id === columnId);
      expect(deletedColumn).toBeUndefined();
    });
    
    it('should return 400 if trying to delete the last column', async () => {
      // Get all columns
      let currentColumns = await request(app)
        .get('/api/columns')
        .expect(200);
      
      expect(currentColumns.body.length).toBeGreaterThan(0);
      
      // Delete columns one by one until only one remains
      while (currentColumns.body.length > 1) {
        // Delete the last column in the list
        const columnToDelete = currentColumns.body[currentColumns.body.length - 1];
        await request(app)
          .delete(`/api/columns/${columnToDelete.id}`)
          .expect(204);
        
        // Refresh the column list
        currentColumns = await request(app)
          .get('/api/columns')
          .expect(200);
      }
      
      // Verify only one column remains
      expect(currentColumns.body.length).toBe(1);
      
      // Try to delete the last remaining column - should fail with 400
      const lastColumn = currentColumns.body[0];
      const response = await request(app)
        .delete(`/api/columns/${lastColumn.id}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Cannot delete the last column');
    });
  });
  
  describe('POST /api/columns/reorder', () => {
    it('should reorder multiple columns', async () => {
      // Create some columns
      const col1 = await request(app)
        .post('/api/columns')
        .send({ title: 'Column 1', orderIndex: 0 })
        .expect(201);
      
      const col2 = await request(app)
        .post('/api/columns')
        .send({ title: 'Column 2', orderIndex: 1 })
        .expect(201);
      
      const col3 = await request(app)
        .post('/api/columns')
        .send({ title: 'Column 3', orderIndex: 2 })
        .expect(201);
      
      // Reorder them
      const response = await request(app)
        .post('/api/columns/reorder')
        .send({
          orders: [
            { id: col3.body.id, orderIndex: 0 },
            { id: col1.body.id, orderIndex: 1 },
            { id: col2.body.id, orderIndex: 2 }
          ]
        })
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verify new order
      const col3Updated = response.body.find(c => c.id === col3.body.id);
      const col1Updated = response.body.find(c => c.id === col1.body.id);
      const col2Updated = response.body.find(c => c.id === col2.body.id);
      
      expect(col3Updated.order_index).toBe(0);
      expect(col1Updated.order_index).toBe(1);
      expect(col2Updated.order_index).toBe(2);
    });
    
    it('should return 400 if orders is not an array', async () => {
      const response = await request(app)
        .post('/api/columns/reorder')
        .send({
          orders: 'not an array'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Orders must be an array');
    });
  });
});

