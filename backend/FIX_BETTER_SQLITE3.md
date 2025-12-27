# Fixing better-sqlite3 for Tests

The tests are failing because `better-sqlite3` needs to be compiled for your Node.js version (24.12.0).

## Quick Fix Options

### Option 1: Install Visual Studio Build Tools (Recommended)

1. Download and install **Visual Studio Build Tools**:
   - Go to: https://visualstudio.microsoft.com/downloads/
   - Download "Build Tools for Visual Studio 2022"
   - During installation, select "Desktop development with C++" workload

2. Rebuild better-sqlite3:
   ```bash
   cd backend
   npm rebuild better-sqlite3
   ```

3. Run tests:
   ```bash
   npm test
   ```

### Option 2: Use Prebuilt Binary (If Available)

Try installing with prebuilt binaries:
```bash
cd backend
npm install better-sqlite3 --force
```

### Option 3: Install Python (Alternative)

If you prefer Python:
1. Install Python 3.6+ from https://www.python.org/downloads/
2. Check "Add Python to PATH" during installation
3. Rebuild:
   ```bash
   cd backend
   npm rebuild better-sqlite3
   ```

## Verify Installation

After rebuilding, verify the native module exists:
```powershell
Test-Path "node_modules\better-sqlite3\build\Release\better_sqlite3.node"
```

Should return `True`.

## Run Tests

Once better-sqlite3 is built:
```bash
npm test
```

