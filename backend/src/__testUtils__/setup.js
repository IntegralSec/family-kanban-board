// This file sets up the test environment (no Jest globals to avoid being treated as a test suite)
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set test database path to a writable location
// Use /tmp in Docker/Linux, or a temp directory in the test folder for Windows
const testDbPath = process.platform === 'win32' 
  ? join(__dirname, '../test.db')
  : '/tmp/kanban-test.db';

process.env.DATA_PATH = testDbPath;

