# Running Tests

## Problem

The tests require `better-sqlite3` to be compiled, which needs build tools (Python + C++ compiler). On Windows, this can be difficult to set up.

## Solution: Run Tests in Docker (Recommended)

Since your project already uses Docker, the easiest way to run tests is using Docker, which has all the build tools pre-installed.

### Quick Start

```bash
# From the project root directory
docker-compose -f docker-compose.test.yml run --rm backend npm test
```

Or use the npm script:
```bash
cd backend
npm run test:docker
```

### Other Test Commands in Docker

```bash
# Watch mode
docker-compose -f docker-compose.test.yml run --rm backend npm run test:watch

# Coverage
docker-compose -f docker-compose.test.yml run --rm backend npm run test:coverage
```

## Alternative: Install Build Tools Locally

If you prefer to run tests locally without Docker:

### Option 1: Visual Studio Build Tools

1. Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
2. Install "Build Tools for Visual Studio 2022"
3. Select "Desktop development with C++" workload
4. Rebuild:
   ```bash
   cd backend
   npm rebuild better-sqlite3
   npm test
   ```

### Option 2: Install Python 3.6+

1. Download from https://www.python.org/downloads/
2. **Important**: Check "Add Python to PATH" during installation
3. Verify Python is accessible:
   ```powershell
   python --version
   ```
4. Rebuild:
   ```bash
   cd backend
   npm rebuild better-sqlite3
   npm test
   ```

### Option 3: Use Node.js 20 (LTS)

`better-sqlite3` has better prebuilt binary support for Node.js LTS versions. You could use Node.js 20 instead of 24.12.0:

```bash
# Install Node.js 20 LTS
# Then reinstall dependencies
cd backend
npm install
npm test
```

## Verify Installation

After rebuilding, check if the native module exists:
```powershell
Test-Path "backend\node_modules\better-sqlite3\build\Release\better_sqlite3.node"
```

Should return `True`.

## Why Docker is Recommended

- ✅ No need to install build tools on your machine
- ✅ Consistent environment across all developers
- ✅ Matches your production Docker setup
- ✅ Works immediately without configuration

