# 🎯 Family Kanban Board

A lightweight, touch-friendly Kanban board web app designed for Raspberry Pi and always-on household displays.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- **Simple Kanban Board** - Default columns: Backlog, Today, In Progress, Done
- **Touch-Optimized UI** - Large buttons, easy drag-and-drop, works great on touchscreens
- **Family Members** - Assign tasks to household members with color-coded avatars
- **Quick Filtering** - Filter by person, today's tasks, or search
- **Light & Dark Themes** - Easy on the eyes for always-on displays
- **Lightweight** - Runs smoothly on Raspberry Pi 4
- **Persistent Storage** - SQLite database survives reboots
- **Export Data** - Download your board data as JSON

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone or download the project
cd kanban-board

# Build and run with Docker Compose
docker compose up -d

# Access the board
open http://localhost:3000
```

### Manual Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Build frontend
npm run build

# Start the server
cd ../backend
DATA_PATH=./board.db npm start
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DATA_PATH` | `/data/board.db` | Path to SQLite database file |

### Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  kanban:
    ports:
      - "8080:3000"  # Change external port
    environment:
      - PORT=3000
```

## 🍓 Raspberry Pi Deployment

### Prerequisites

- Raspberry Pi 4 (2GB+ RAM recommended)
- Raspberry Pi OS (64-bit recommended)
- Docker and Docker Compose installed

### Installation Steps

1. **Install Docker on Raspberry Pi:**

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

2. **Clone and deploy:**

```bash
git clone <repository-url> kanban-board
cd kanban-board
docker compose up -d
```

3. **Auto-start on boot:**

Docker Compose with `restart: unless-stopped` handles this automatically.

4. **Set up kiosk mode (optional):**

Create `/etc/xdg/autostart/kanban-kiosk.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Kanban Kiosk
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost:3000
```

### Building for ARM

The Dockerfile uses multi-arch compatible base images. To build specifically for ARM:

```bash
# On Raspberry Pi
docker build -t family-kanban .

# Cross-compile from x86
docker buildx build --platform linux/arm64 -t family-kanban .
```

## 📁 Project Structure

```
kanban-board/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server entry
│   │   ├── db/
│   │   │   ├── index.js      # Database operations
│   │   │   └── schema.sql    # SQLite schema
│   │   └── routes/
│   │       ├── board.js      # Board API
│   │       ├── cards.js      # Cards API
│   │       ├── columns.js    # Columns API
│   │       └── members.js    # Members API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main app component
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   └── styles/           # CSS styles
│   ├── index.html
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔌 API Reference

### Board

- `GET /api/board` - Get board with all columns, cards, and members
- `PUT /api/board` - Update board name and theme
- `GET /api/board/export` - Export board data as JSON

### Columns

- `GET /api/columns` - List all columns
- `POST /api/columns` - Create a column
- `PUT /api/columns/:id` - Update a column
- `DELETE /api/columns/:id` - Delete a column
- `POST /api/columns/reorder` - Reorder columns

### Cards

- `GET /api/cards` - List all cards
- `POST /api/cards` - Create a card
- `PUT /api/cards/:id` - Update a card
- `DELETE /api/cards/:id` - Delete a card
- `POST /api/cards/reorder` - Reorder/move cards

### Members

- `GET /api/members` - List all members
- `POST /api/members` - Create a member
- `PUT /api/members/:id` - Update a member
- `DELETE /api/members/:id` - Delete a member

### Health Check

- `GET /health` - Server health status

## 🎨 Customization

### Themes

The app supports Light and Dark themes, configurable in Settings.

### Card Colors

Cards can be tagged with colors:
- 🔴 Coral - `#e07a5f`
- 🟠 Orange - `#f2a65a`
- 🟡 Yellow - `#f2cc8f`
- 🟢 Green - `#81b29a`
- 🔵 Blue - `#6b9ac4`
- 🟣 Purple - `#9b8bc4`
- 🩷 Pink - `#d4a5a5`

### Emojis

Available card emojis: 📋 🏠 🛒 💰 🍳 🧹 📚 💪 🎉 ⭐ ❤️ 🔧

## 🛠 Development

### Prerequisites

- Node.js 20+
- npm 9+

### Running in Development

```bash
# Terminal 1: Backend (with auto-reload)
cd backend
DATA_PATH=./dev.db npm run dev

# Terminal 2: Frontend (with hot reload)
cd frontend
npm run dev
```

Frontend dev server runs on `http://localhost:5173` and proxies API calls to the backend.

## 📄 License

MIT License - feel free to use this for your family's needs!

## 🤝 Contributing

Contributions welcome! Please keep the codebase simple and focused on the household use case.

---

Made with ❤️ for busy families

