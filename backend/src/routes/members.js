import { Router } from 'express';
import xss from 'xss';
import { getMembers, createMember, updateMember, deleteMember } from '../db/index.js';

const router = Router();

// Get all members
router.get('/', (req, res) => {
    try {
        const members = getMembers();
        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

// Create a new member
router.post('/', (req, res) => {
    try {
        const { name, color, avatar } = req.body;
        
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        const sanitizedName = xss(name.trim());
        const sanitizedColor = color ? xss(color) : '#6366f1';
        const sanitizedAvatar = avatar ? xss(avatar) : null;
        
        const member = createMember(sanitizedName, sanitizedColor, sanitizedAvatar);
        res.status(201).json(member);
    } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).json({ error: 'Failed to create member' });
    }
});

// Update a member
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, color, avatar } = req.body;
        
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        const sanitizedName = xss(name.trim());
        const sanitizedColor = color ? xss(color) : '#6366f1';
        const sanitizedAvatar = avatar ? xss(avatar) : null;
        
        const member = updateMember(parseInt(id), sanitizedName, sanitizedColor, sanitizedAvatar);
        
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        res.json(member);
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// Delete a member
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        deleteMember(parseInt(id));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ error: 'Failed to delete member' });
    }
});

export default router;

