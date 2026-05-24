# Chat App

Real-time chat application dengan room-based messaging, QR code invite, stream overlay untuk OBS, dan admin dashboard lengkap.

## Features

- **Real-time chat** via WebSocket
- **QR code invite** — share link atau scan QR, bisa dipakai banyak orang
- **Stream overlay** — tampilan live chat untuk OBS (green screen ready)
- **Admin Dashboard**
  - Buat & kelola room
  - Monitor live chat dengan tombol pin per pesan
  - List user yang sedang terhubung + jumlah pesan real-time
  - Pin pesan custom atau pesan dari user langsung
  - View detail & download QR code (PNG)
  - Room lama otomatis di-close saat buat room baru
- **Censored Words**
  - Daftar kata sensor dinamis, tersimpan otomatis ke file
  - Partial masking — huruf awal/akhir tetap terlihat (contoh: `anjing` → `an***g`)
  - Substring matching — variasi kata ikut tersensor (contoh: `babik` → `b**ik`)

## Tech Stack

- **Backend**: Node.js + Express + WebSocket (`ws`)
- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **QR**: `qrcode` package

## Cara Run

### 1. Clone & install dependencies

```bash
git clone https://github.com/n0l3r/chat-app.git
cd chat-app/backend-node
npm install
```

### 2. Setup environment

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan:

```env
PORT=8080
BASE_URL=http://localhost:8080
NODE_ENV=development
```

### 3. Jalankan server

```bash
# Production
npm start

# Development (auto-restart on file change)
npm run dev
```

Server berjalan di `http://localhost:8080`

### 4. Akses admin panel

Buka di browser:
```
http://localhost:8080/admin-panel-secret-access-2026
```

## Cara Pakai

1. Buka admin panel di URL di atas
2. Klik **Create New Room**
3. Scan QR code atau copy link chat → bagikan ke peserta
4. Peserta buka link, masukkan nama, dan mulai chat
5. Admin bisa memantau dari panel **Live Chat Monitor**
6. Untuk OBS: copy **Stream Link** lalu tambahkan sebagai Browser Source

## Struktur Project

```
chat-app/
├── backend-node/
│   ├── server.js              # Entry point, routes, stream HTML
│   ├── package.json
│   ├── .env.example
│   ├── Procfile               # Untuk Heroku
│   ├── data/
│   │   └── bad-words.json     # Daftar kata sensor (auto-generated)
│   ├── room/
│   │   └── manager.js         # Room, invite, pin management
│   ├── handlers/
│   │   ├── room.js            # REST API handlers
│   │   └── websocket.js       # WebSocket handlers (chat & stream)
│   └── utils/
│       └── filter.js          # Word censor engine
└── frontend/
    ├── index.html             # Admin dashboard
    ├── chat.html              # Halaman chat user
    ├── css/
    │   ├── style.css          # Shared styles
    │   └── admin.css          # Admin dashboard styles
    └── js/
        └── chat.js            # Chat page logic
```

## API Reference

### Room Management

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/room` | Buat room baru (room lama otomatis di-close) |
| `POST` | `/api/room/:id/invite` | Generate invite link baru |
| `GET` | `/api/qr/:token` | QR code PNG |
| `GET` | `/api/admin/rooms` | List semua room aktif |

### Pin Message

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/room/:id/pin` | Pin pesan `{ content, name }` |
| `DELETE` | `/api/room/:id/pin` | Unpin pesan |
| `GET` | `/api/room/:id/pin` | Ambil pesan yang sedang di-pin |

### Censored Words

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/admin/words` | Ambil semua kata sensor |
| `POST` | `/api/admin/words` | Tambah kata `{ word }` |
| `DELETE` | `/api/admin/words/:word` | Hapus kata |

### Pages & WebSocket

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /c/:token` | Halaman chat (memerlukan invite token) |
| `GET /s/:roomId` | Stream overlay untuk OBS |
| `WS /ws/:token?name=xxx` | WebSocket untuk chat user |
| `WS /ws-stream/:roomId` | WebSocket untuk stream/admin monitor |

## Environment Variables

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | `8080` | Port server |
| `BASE_URL` | `http://localhost:8080` | URL publik untuk QR code |
| `NODE_ENV` | `development` | Mode environment |

## Deploy

### Heroku
```bash
heroku create
heroku config:set BASE_URL=https://your-app.herokuapp.com
heroku config:set NODE_ENV=production
git push heroku main
```

### Railway / Render
Set environment variables di dashboard:
- `BASE_URL=https://your-app.railway.app`
- `NODE_ENV=production`

> **Catatan:** `data/bad-words.json` akan di-reset setiap deploy ulang pada platform yang tidak punya persistent storage. Export dulu via `GET /api/admin/words` sebelum redeploy jika perlu.
