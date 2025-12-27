# Testing Guide

This document describes the testing setup for the Family Kanban Board backend API.

## Overview

The project uses **Jest** as the test framework and **Supertest** for HTTP endpoint testing. All tests are located in the `src/__tests__/` directory.

## Prerequisites

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Ensure you have Node.js 18+ installed (required for ES modules support in Jest)

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

### Test Files

- `board.test.js` - Tests for board endpoints (GET, PUT, export, download-db)
- `columns.test.js` - Tests for column CRUD operations and reordering
- `cards.test.js` - Tests for card CRUD operations and reordering
- `members.test.js` - Tests for member CRUD operations
- `health.test.js` - Tests for health check endpoint

### Test Setup

- `setup.js` - Global test setup and teardown (database cleanup)
- `helpers.js` - Test utilities and helper functions

## Test Database

Tests use a separate test database (`src/test.db`) that is automatically created and cleaned up:
- Created fresh before each test run
- Deleted after all tests complete
- Isolated from the production database

The test database path is controlled by the `DATA_PATH` environment variable, which is set in `setup.js`.

## Test Coverage

The test suite covers:

### Board API
- ✅ Get full board state
- ✅ Update board settings (name, theme)
- ✅ Export board data
- ✅ Download database file
- ✅ XSS sanitization
- ✅ Input validation

### Columns API
- ✅ Get all columns
- ✅ Create column
- ✅ Update column
- ✅ Delete column (with last column protection)
- ✅ Reorder columns
- ✅ XSS sanitization
- ✅ Input validation

### Cards API
- ✅ Get all cards
- ✅ Create card (with all fields)
- ✅ Update card
- ✅ Delete card
- ✅ Reorder cards (within column and between columns)
- ✅ XSS sanitization
- ✅ Input validation

### Members API
- ✅ Get all members
- ✅ Create member
- ✅ Update member
- ✅ Delete member (with card assignee cleanup)
- ✅ XSS sanitization
- ✅ Input validation

### Health Check
- ✅ Health status endpoint
- ✅ Timestamp validation

## Writing New Tests

When adding new tests:

1. Create test files in `src/__tests__/` directory
2. Use the `createTestApp()` helper from `helpers.js` to get a test Express app
3. Use Supertest's `request()` function to make HTTP requests
4. Follow the existing test patterns for consistency

Example:
```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from './helpers.js';

describe('My New API', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  it('should do something', async () => {
    const response = await request(app)
      .get('/api/my-endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## Troubleshooting

### Tests fail with "Database not initialized"
- Ensure `setup.js` is properly configured
- Check that the test database path is writable

### ES Module errors
- Ensure you're using Node.js 18+
- Verify `NODE_OPTIONS=--experimental-vm-modules` is set (handled by cross-env)

### Port already in use
- Tests don't actually start a server, so this shouldn't occur
- If it does, check for other running instances

## Continuous Integration

These tests are designed to run in CI/CD pipelines. The test database is automatically managed and doesn't require external setup.

