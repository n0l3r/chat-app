# Chat App - Node.js Version

Versi Node.js dari chat app dengan fitur yang sama dengan versi Go.

## Features ✨
- ✅ Real-time WebSocket chat
- ✅ Single-use invite tokens (1 link = 1 user)
- ✅ QR code generation
- ✅ Admin panel untuk create room
- ✅ Stream display untuk OBS
- ✅ Mobile-first responsive design

## Tech Stack
- **Backend**: Node.js + Express + WebSocket (ws)
- **Frontend**: Vanilla HTML/CSS/JS
- **QR**: qrcode package

## Quick Start

```bash
cd backend-node
npm install
npm start
```

Server: `http://localhost:8080`

## Deploy Ready 🚀

Siap deploy ke:
- **Heroku**: Sudah ada `engines` di package.json
- **Vercel**: Serverless functions compatible
- **Railway**: Node.js support
- **Render**: Auto-detect package.json

## Files

```
backend-node/
├── server.js           # Main server
├── package.json        # Dependencies
├── room/
│   └── manager.js      # Room & invite management
└── handlers/
    ├── room.js         # API routes
    └── websocket.js    # WebSocket handlers
```

## Environment Variables

```bash
PORT=8080                              # Server port
BASE_URL=https://your-domain.com       # For QR codes
```

## API Same as Go version

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/room` | POST | Create room + first invite |
| `/api/room/:id/invite` | POST | Generate new invite |
| `/api/qr/:token` | GET | QR code PNG |
| `/c/:token` | GET | Chat page (single-use) |
| `/s/:roomId` | GET | Stream display |