# Chat Room with QR Code

Real-time chat application dengan room-based messaging dan QR code sharing.

## Features
- Create chat rooms dengan QR code
- Real-time messaging via WebSocket
- Username untuk setiap user
- Mobile-first responsive design
- Lightweight (vanilla HTML/CSS/JS)

## Run

```bash
cd backend
go mod tidy
go run main.go
```

Server akan jalan di `http://localhost:8080`

## Usage

1. Buka `http://localhost:8080` (Admin page)
2. Klik "Create New Room"
3. Scan QR code atau share link
4. Masukkan nama dan mulai chat

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/room` | Create new room |
| GET | `/api/room/:id` | Get room info |
| GET | `/api/room/:id/qr` | Get QR code (PNG) |
| WS | `/ws/:roomId?name=xxx` | WebSocket connection |

## Structure

```
chat-app/
├── backend/
│   ├── main.go
│   ├── handlers/
│   │   ├── room.go
│   │   └── websocket.go
│   └── room/
│       └── manager.go
└── frontend/
    ├── index.html (Admin)
    ├── chat.html
    ├── css/style.css
    └── js/
        ├── admin.js
        └── chat.js
```
