# Development Server Scripts

Scripts to run both backend and frontend development servers simultaneously.

## Available Scripts

### 1. **Node.js Script** (Cross-platform)
**File:** `run-dev.js`

Run both servers in a single process using Node.js:

```bash
node run-dev.js
```

**Advantages:**
- Cross-platform (Windows, macOS, Linux)
- Single process to manage
- Centralized output with timestamps and service labels
- Graceful shutdown with Ctrl+C

### 2. **PowerShell Script** (Windows)
**File:** `run-dev.ps1`

Run both servers using PowerShell jobs:

```powershell
.\run-dev.ps1
```

**Note:** You may need to allow script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. **Bash Script** (macOS/Linux)
**File:** `run-dev.sh`

Run both servers using background processes:

```bash
bash run-dev.sh
```

Or make it executable:
```bash
chmod +x run-dev.sh
./run-dev.sh
```

### 4. **Batch Script** (Windows)
**File:** `run-dev.bat`

Run both servers in separate command windows:

```cmd
run-dev.bat
```

## What These Scripts Do

1. **Verify** that both `backend/` and `frontend/` directories exist
2. **Start Backend** - Runs `npm run dev` in the backend directory (uses nodemon)
3. **Wait** - Gives the backend 2 seconds to initialize
4. **Start Frontend** - Runs `npm run dev` in the frontend directory (uses Vite)
5. **Manage** - Handles graceful shutdown (Ctrl+C)

## Requirements

- Node.js 20.x or higher
- npm or yarn
- Dependencies installed in both backend and frontend directories

To install dependencies, run:
```bash
cd backend && npm install
cd ../frontend && npm install
```

## Expected Output

### Backend
- Server running on port (check `.env` or server.js for port)
- Database connection status
- Route initialization logs

### Frontend
- Vite dev server running on http://localhost:5173 (or similar)
- HMR (Hot Module Replacement) ready

## Troubleshooting

### Port Already in Use
If you see errors about ports already being in use:
- Check what's running on those ports
- Kill existing processes or use different ports
- Update environment variables in `.env` files

### npm Command Not Found
- Ensure Node.js and npm are installed: `node -v` and `npm -v`
- Add npm to your PATH environment variable

### Dependencies Missing
Run in both directories:
```bash
npm install
```

## Recommended Usage

**For Windows users:** Use `node run-dev.js` (most reliable)

**For macOS/Linux users:** Use `bash run-dev.sh` or `node run-dev.js`

**For separate monitoring:** Use `run-dev.bat` (Windows) or open two terminals and run:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```
