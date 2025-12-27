import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp, cleanupDatabase } from '../__testUtils__/helpers.js';

describe('Members API', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  describe('GET /api/members', () => {
    it('should return all members', async () => {
      const response = await request(app)
        .get('/api/members')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('should return members with required fields', async () => {
      // Create a member first
      await request(app)
        .post('/api/members')
        .send({
          name: 'Test Member',
          color: '#ff0000'
        })
        .expect(201);
      
      const response = await request(app)
        .get('/api/members')
        .expect(200);
      
      if (response.body.length > 0) {
        const member = response.body[0];
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('color');
        expect(member).toHaveProperty('created_at');
        expect(member).toHaveProperty('updated_at');
      }
    });
    
    it('should return members ordered by name', async () => {
      // Create multiple members
      await request(app)
        .post('/api/members')
        .send({ name: 'Zebra', color: '#000000' })
        .expect(201);
      
      await request(app)
        .post('/api/members')
        .send({ name: 'Alice', color: '#ff0000' })
        .expect(201);
      
      await request(app)
        .post('/api/members')
        .send({ name: 'Bob', color: '#00ff00' })
        .expect(201);
      
      const response = await request(app)
        .get('/api/members')
        .expect(200);
      
      // Check ordering (should be alphabetical by name)
      const names = response.body.map(m => m.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });
  
  describe('POST /api/members', () => {
    it('should create a new member with minimal data', async () => {
      const response = await request(app)
        .post('/api/members')
        .send({
          name: 'New Member'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Member');
      expect(response.body.color).toBe('#6366f1'); // Default color
    });
    
    it('should create a member with all fields', async () => {
      const response = await request(app)
        .post('/api/members')
        .send({
          name: 'Complete Member',
          color: '#ff0000',
          avatar: '👤'
        })
        .expect(201);
      
      expect(response.body.name).toBe('Complete Member');
      expect(response.body.color).toBe('#ff0000');
      expect(response.body.avatar).toBe('👤');
    });
    
    it('should sanitize XSS in member name', async () => {
      const response = await request(app)
        .post('/api/members')
        .send({
          name: '<script>alert("xss")</script>Test Member'
        })
        .expect(201);
      
      expect(response.body.name).not.toContain('<script>');
      expect(response.body.name).toContain('Test Member');
    });
    
    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/members')
        .send({
          color: '#ff0000'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Name is required');
    });
    
    it('should return 400 if name is not a string', async () => {
      const response = await request(app)
        .post('/api/members')
        .send({
          name: 123
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /api/members/:id', () => {
    it('should update member name', async () => {
      // Create a member
      const createResponse = await request(app)
        .post('/api/members')
        .send({
          name: 'Original Name'
        })
        .expect(201);
      
      const memberId = createResponse.body.id;
      
      // Update it
      const updateResponse = await request(app)
        .put(`/api/members/${memberId}`)
        .send({
          name: 'Updated Name'
        })
        .expect(200);
      
      expect(updateResponse.body.name).toBe('Updated Name');
    });
    
    it('should update all member fields', async () => {
      // Create a member
      const createResponse = await request(app)
        .post('/api/members')
        .send({
          name: 'Original Member',
          color: '#ff0000',
          avatar: '👤'
        })
        .expect(201);
      
      const memberId = createResponse.body.id;
      
      // Update all fields
      const updateResponse = await request(app)
        .put(`/api/members/${memberId}`)
        .send({
          name: 'Updated Member',
          color: '#00ff00',
          avatar: '🎯'
        })
        .expect(200);
      
      expect(updateResponse.body.name).toBe('Updated Member');
      expect(updateResponse.body.color).toBe('#00ff00');
      expect(updateResponse.body.avatar).toBe('🎯');
    });
    
    it('should return 404 if member not found', async () => {
      const response = await request(app)
        .put('/api/members/99999')
        .send({
          name: 'Updated Name'
        })
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Member not found');
    });
    
    it('should return 400 if name is missing', async () => {
      const createResponse = await request(app)
        .post('/api/members')
        .send({
          name: 'Test Member'
        })
        .expect(201);
      
      const memberId = createResponse.body.id;
      
      const response = await request(app)
        .put(`/api/members/${memberId}`)
        .send({
          color: '#ff0000'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('DELETE /api/members/:id', () => {
    it('should delete a member', async () => {
      // Create a member
      const createResponse = await request(app)
        .post('/api/members')
        .send({
          name: 'To Delete'
        })
        .expect(201);
      
      const memberId = createResponse.body.id;
      
      // Delete it
      await request(app)
        .delete(`/api/members/${memberId}`)
        .expect(204);
      
      // Verify it's gone
      const getResponse = await request(app)
        .get('/api/members')
        .expect(200);
      
      const deletedMember = getResponse.body.find(m => m.id === memberId);
      expect(deletedMember).toBeUndefined();
    });
    
    it('should clear assignee_id from cards when member is deleted', async () => {
      // Create a member
      const memberResponse = await request(app)
        .post('/api/members')
        .send({
          name: 'To Delete'
        })
        .expect(201);
      const memberId = memberResponse.body.id;
      
      // Get an existing column or create one
      const columnsResponse = await request(app)
        .get('/api/columns')
        .expect(200);
      
      let columnId;
      if (columnsResponse.body.length > 0) {
        columnId = columnsResponse.body[0].id;
      } else {
        const columnResponse = await request(app)
          .post('/api/columns')
          .send({ title: 'Test Column' })
          .expect(201);
        columnId = columnResponse.body.id;
      }
      
      // Create a card assigned to the member
      const cardResponse = await request(app)
        .post('/api/cards')
        .send({
          columnId: columnId,
          title: 'Assigned Card',
          assigneeId: memberId
        })
        .expect(201);
      const cardId = cardResponse.body.id;
      
      // Verify the card exists and is assigned to the member
      const verifyBeforeResponse = await request(app)
        .get('/api/cards')
        .expect(200);
      const cardBefore = verifyBeforeResponse.body.find(c => c.id === cardId);
      expect(cardBefore).toBeDefined();
      expect(cardBefore.assignee_id).toBe(memberId);
      
      // Delete the member
      await request(app)
        .delete(`/api/members/${memberId}`)
        .expect(204);
      
      // Verify card's assignee_id is cleared (null) - card should still exist
      const cardResponse2 = await request(app)
        .get('/api/cards')
        .expect(200);
      
      const card = cardResponse2.body.find(c => c.id === cardId);
      expect(card).toBeDefined();
      expect(card.assignee_id).toBeNull();
    });
  });
});

