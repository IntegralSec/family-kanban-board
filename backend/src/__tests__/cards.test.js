import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp, cleanupDatabase } from '../__testUtils__/helpers.js';

describe('Cards API', () => {
  let app;
  let testColumnId;
  let testMemberId;
  
  beforeEach(async () => {
    app = createTestApp();
    
    // Create a test column - use the first available column or create a new one
    const columnsResponse = await request(app)
      .get('/api/columns')
      .expect(200);
    
    if (columnsResponse.body.length > 0) {
      // Use the first existing column
      testColumnId = columnsResponse.body[0].id;
    } else {
      // Create a new column if none exist
      const columnResponse = await request(app)
        .post('/api/columns')
        .send({ title: 'Test Column' })
        .expect(201);
      testColumnId = columnResponse.body.id;
    }
    
    // Create a test member
    const memberResponse = await request(app)
      .post('/api/members')
      .send({ name: 'Test Member', color: '#ff0000' })
      .expect(201);
    testMemberId = memberResponse.body.id;
  });
  
  describe('GET /api/cards', () => {
    it('should return all cards', async () => {
      const response = await request(app)
        .get('/api/cards')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('should return cards with required fields', async () => {
      // Create a card first
      await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Test Card'
        })
        .expect(201);
      
      const response = await request(app)
        .get('/api/cards')
        .expect(200);
      
      if (response.body.length > 0) {
        const card = response.body[0];
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('board_id');
        expect(card).toHaveProperty('column_id');
        expect(card).toHaveProperty('title');
        expect(card).toHaveProperty('order_index');
        expect(card).toHaveProperty('created_at');
        expect(card).toHaveProperty('updated_at');
        expect(Array.isArray(card.tags)).toBe(true);
      }
    });
  });
  
  describe('POST /api/cards', () => {
    it('should create a new card with minimal data', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'New Card'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Card');
      expect(response.body.column_id).toBe(testColumnId);
      expect(Array.isArray(response.body.tags)).toBe(true);
    });
    
    it('should create a card with all fields', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Complete Card',
          description: 'This is a description',
          assigneeId: testMemberId,
          color: '#ff0000',
          emoji: '🎯',
          tags: ['urgent', 'important'],
          dueDate: '2025-12-31',
          orderIndex: 0
        })
        .expect(201);
      
      expect(response.body.title).toBe('Complete Card');
      expect(response.body.description).toBe('This is a description');
      expect(response.body.assignee_id).toBe(testMemberId);
      expect(response.body.color).toBe('#ff0000');
      expect(response.body.emoji).toBe('🎯');
      expect(response.body.tags).toEqual(['urgent', 'important']);
      expect(response.body.due_date).toBe('2025-12-31');
      expect(response.body.order_index).toBe(0);
    });
    
    it('should sanitize XSS in card fields', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: '<script>alert("xss")</script>Test Card',
          description: '<img src=x onerror=alert(1)>Description'
        })
        .expect(201);
      
      expect(response.body.title).not.toContain('<script>');
      expect(response.body.title).toContain('Test Card');
      // XSS library sanitizes but may leave safe HTML tags - verify dangerous attributes are removed
      expect(response.body.description).not.toContain('onerror');
      expect(response.body.description).toContain('Description');
    });
    
    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Title is required');
    });
    
    it('should return 400 if columnId is missing', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({
          title: 'Test Card'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Column ID is required');
    });
    
    it('should default orderIndex to end of column if not provided', async () => {
      // Get current cards in the column to determine the next order index
      const currentCardsResponse = await request(app)
        .get('/api/cards')
        .expect(200);
      
      const cardsInColumn = currentCardsResponse.body.filter(c => c.column_id === testColumnId);
      const initialCount = cardsInColumn.length;
      
      // Create first card
      await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'First Card'
        })
        .expect(201);
      
      // Create second card without orderIndex - should be placed at the end
      const response = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Second Card'
        })
        .expect(201);
      
      // The order index should be one more than the initial count (0-indexed)
      expect(response.body.order_index).toBe(initialCount + 1);
    });
  });
  
  describe('PUT /api/cards/:id', () => {
    it('should update card title', async () => {
      // Create a card
      const createResponse = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Original Title'
        })
        .expect(201);
      
      const cardId = createResponse.body.id;
      
      // Update it
      const updateResponse = await request(app)
        .put(`/api/cards/${cardId}`)
        .send({
          title: 'Updated Title'
        })
        .expect(200);
      
      expect(updateResponse.body.title).toBe('Updated Title');
    });
    
    it('should move card to different column', async () => {
      // Create another column
      const columnResponse = await request(app)
        .post('/api/columns')
        .send({ title: 'Target Column' })
        .expect(201);
      const targetColumnId = columnResponse.body.id;
      
      // Create a card
      const createResponse = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Movable Card'
        })
        .expect(201);
      
      const cardId = createResponse.body.id;
      
      // Move it
      const updateResponse = await request(app)
        .put(`/api/cards/${cardId}`)
        .send({
          columnId: targetColumnId
        })
        .expect(200);
      
      expect(updateResponse.body.column_id).toBe(targetColumnId);
    });
    
    it('should update all card fields', async () => {
      // Create a card
      const createResponse = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Original Card'
        })
        .expect(201);
      
      const cardId = createResponse.body.id;
      
      // Update all fields
      const updateResponse = await request(app)
        .put(`/api/cards/${cardId}`)
        .send({
          title: 'Updated Card',
          description: 'Updated description',
          assigneeId: testMemberId,
          color: '#00ff00',
          emoji: '✅',
          tags: ['done'],
          dueDate: '2025-12-25',
          orderIndex: 5
        })
        .expect(200);
      
      expect(updateResponse.body.title).toBe('Updated Card');
      expect(updateResponse.body.description).toBe('Updated description');
      expect(updateResponse.body.assignee_id).toBe(testMemberId);
      expect(updateResponse.body.color).toBe('#00ff00');
      expect(updateResponse.body.emoji).toBe('✅');
      expect(updateResponse.body.tags).toEqual(['done']);
      expect(updateResponse.body.due_date).toBe('2025-12-25');
      expect(updateResponse.body.order_index).toBe(5);
    });
    
    it('should return 404 if card not found', async () => {
      const response = await request(app)
        .put('/api/cards/99999')
        .send({
          title: 'Updated Title'
        })
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Card not found');
    });
  });
  
  describe('DELETE /api/cards/:id', () => {
    it('should delete a card', async () => {
      // Create a card
      const createResponse = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'To Delete'
        })
        .expect(201);
      
      const cardId = createResponse.body.id;
      
      // Delete it
      await request(app)
        .delete(`/api/cards/${cardId}`)
        .expect(204);
      
      // Verify it's gone
      const getResponse = await request(app)
        .get('/api/cards')
        .expect(200);
      
      const deletedCard = getResponse.body.find(c => c.id === cardId);
      expect(deletedCard).toBeUndefined();
    });
  });
  
  describe('POST /api/cards/reorder', () => {
    it('should reorder cards within same column', async () => {
      // Create multiple cards
      const card1 = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Card 1',
          orderIndex: 0
        })
        .expect(201);
      
      const card2 = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Card 2',
          orderIndex: 1
        })
        .expect(201);
      
      const card3 = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Card 3',
          orderIndex: 2
        })
        .expect(201);
      
      // Reorder them
      const response = await request(app)
        .post('/api/cards/reorder')
        .send({
          orders: [
            { id: card3.body.id, columnId: testColumnId, orderIndex: 0 },
            { id: card1.body.id, columnId: testColumnId, orderIndex: 1 },
            { id: card2.body.id, columnId: testColumnId, orderIndex: 2 }
          ]
        })
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verify new order
      const card3Updated = response.body.find(c => c.id === card3.body.id);
      const card1Updated = response.body.find(c => c.id === card1.body.id);
      const card2Updated = response.body.find(c => c.id === card2.body.id);
      
      expect(card3Updated.order_index).toBe(0);
      expect(card1Updated.order_index).toBe(1);
      expect(card2Updated.order_index).toBe(2);
    });
    
    it('should move cards between columns', async () => {
      // Create another column
      const columnResponse = await request(app)
        .post('/api/columns')
        .send({ title: 'Target Column' })
        .expect(201);
      const targetColumnId = columnResponse.body.id;
      
      // Create a card in first column
      const card = await request(app)
        .post('/api/cards')
        .send({
          columnId: testColumnId,
          title: 'Movable Card'
        })
        .expect(201);
      
      // Move it to target column
      const response = await request(app)
        .post('/api/cards/reorder')
        .send({
          orders: [
            { id: card.body.id, columnId: targetColumnId, orderIndex: 0 }
          ]
        })
        .expect(200);
      
      const movedCard = response.body.find(c => c.id === card.body.id);
      expect(movedCard.column_id).toBe(targetColumnId);
    });
    
    it('should return 400 if orders is not an array', async () => {
      const response = await request(app)
        .post('/api/cards/reorder')
        .send({
          orders: 'not an array'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Orders must be an array');
    });
  });
});

