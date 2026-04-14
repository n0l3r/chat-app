const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { Manager } = require('./room/manager');
const RoomHandler = require('./handlers/room');
const { WSHandler, StreamHandler } = require('./handlers/websocket');

// Environment variables
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize
const app = express();
const server = http.createServer(app);
const manager = new Manager();

// Handlers
const roomHandler = new RoomHandler(manager, BASE_URL);
const wsHandler = new WSHandler(manager);
const streamHandler = new StreamHandler(manager);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/room', roomHandler.createRoom);
app.post('/api/room/:roomId/invite', roomHandler.addInvite);
app.get('/api/qr/:token', roomHandler.getQRCode);

// Redirect root to a placeholder
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><title>Welcome</title>
    <style>body{font-family:Arial;text-align:center;padding:50px;background:#f5f5f5}
    h1{color:#333}p{color:#666}</style></head>
    <body><h1>🌐 Service Running</h1>
    <p>This is a private messaging service.</p>
    <p>Access is by invitation only.</p></body></html>
  `);
});

// Admin page - secret URL
app.get('/admin-panel-secret-access-2026', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Chat page - validates token before serving
app.get('/c/:token', (req, res) => {
  const token = req.params.token;
  const userIP = req.ip || req.connection.remoteAddress;

  const { room, valid } = manager.checkInvite(token, userIP);
  if (!valid || !room) {
    return res.status(403).send('This invite link has already been used');
  }
  
  // Serve static HTML
  res.sendFile(path.join(__dirname, '../frontend/chat.html'));
});

// Stream page - uses roomID directly (admin only)
app.get('/s/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = manager.getRoom(roomId);
  
  if (!room) {
    return res.status(404).send('Room not found');
  }
  
  // Create simple template inline with bottom-to-top messages
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Chat Stream</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: green;
      min-height: 100vh;
      padding: 16px;
    }

    .stream-container {
      position: relative;
      max-width: 1500px;
      min-height: 100%;
      border: 2px solid #6366f1;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
      padding: 12px;
      overflow: hidden;
    }

    .stream-label {
      position: absolute;
      top: -2px;
      left: 12px;
      background: #6366f1;
      color: white;
      padding: 4px 12px;
      border-radius: 0 0 8px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      z-index: 10;
    }

    .messages {
      height: 100%;
      display: flex;
      flex-direction: column-reverse; /* Bottom to top */
      gap: 6px;
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      padding-top: 20px;
    }

    .messages::-webkit-scrollbar {
      display: none;
    }

    .message {
      background: rgba(0, 0, 0, 0.5);
      border: 5px solid #ffffff;
      box-shadow: 0 10px 25px rgb(255,255,255);
      color: white;
      padding: 8px 12px;
      border-radius: 12px;
      animation: slideInFromBottom 0.4s ease-out;
      word-wrap: break-word;
      /*border-left: 3px solid #6366f1;*/
    }

    .message .name {
      font-weight: 700;
      color: #a78bfa;
      display: block;
      margin-bottom: 8px;
      font-size: 3.5rem;
      line-height: 1.1;
    }

    .message .content {
      display: block;
      color: #fff;
      font-size: 4rem;
      line-height: 1.2;
    }

    .message .time {
      font-size: 2.5rem;
      color: #94a3b8;
      margin-top: 8px;
      text-align: right;
    }

    .message.system {
      background: rgba(59, 130, 246, 0.6);
      font-size: 0.8rem;
      color: #e0e7ff;
      font-style: italic;
      text-align: center;
      border-left: 3px solid #3b82f6;
    }

    @keyframes slideInFromBottom {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .connection-status {
      position: absolute;
      top: 4px;
      right: 8px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
    }

    .connection-status.offline {
      background: #ef4444;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  </style>
</head>
<body>
  <div class="stream-container">
    <div class="stream-label">LIVE CHAT</div>
    <div class="connection-status" id="status"></div>
    <div class="messages" id="messages"></div>
  </div>

  <script>
    const roomId = '${roomId}';
    const maxMessages = 15;
    const nameColorMap = new Map();

    connectWebSocket();

    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(\`\${protocol}//\${window.location.host}/ws-stream/\${roomId}\`);

      ws.onopen = () => {
        document.getElementById('status').classList.remove('offline');
      };

      ws.onclose = () => {
        document.getElementById('status').classList.add('offline');
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        document.getElementById('status').classList.add('offline');
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.name === '__stream__' || msg.type === 'system') return;
        renderMessage(msg);
      };
    }

    function renderMessage(msg) {
      const container = document.getElementById('messages');
      const div = document.createElement('div');
      const safeName = msg.name || 'Anonymous';
      const safeContent = msg.content || '';
      const safeTime = msg.timestamp || '';
      div.className = 'message';
      div.innerHTML = \`
        <div class="name">\${escapeHtml(safeName)}</div>
        <div class="content">\${escapeHtml(safeContent)}</div>
        <div class="time">\${safeTime}</div>
      \`;
      div.querySelector('.name').style.color = getNameColor(safeName);

      // Add to top (will appear at bottom due to flex-direction: column-reverse)
      container.insertBefore(div, container.firstChild);

      // Keep only recent messages
      while (container.children.length > maxMessages) {
        container.removeChild(container.lastChild);
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function getNameColor(name) {
      if (nameColorMap.has(name)) return nameColorMap.get(name);

      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0;
      }

      const hue = Math.abs(hash) % 360;
      const color = \`hsl(\${hue} 85% 70%)\`;
      nameColorMap.set(name, color);
      return color;
    }
  </script>
</body>
</html>`;
  
  res.send(html);
});

// Serve static files AFTER route handlers
app.use(express.static(path.join(__dirname, '../frontend')));

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  if (req.url.includes('/ws-stream/')) {
    streamHandler.handleConnection(ws, req);
  } else {
    wsHandler.handleConnection(ws, req);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📱 Admin panel: ${BASE_URL}/admin-panel-secret-access-2024`);
  console.log(`📺 Stream example: ${BASE_URL}/s/ROOM_ID`);
});
