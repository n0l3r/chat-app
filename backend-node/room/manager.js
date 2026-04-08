const crypto = require('crypto');

class Room {
  constructor(id) {
    this.id = id;
    this.clients = new Map();
    this.streamClients = new Map();
    this.messages = []; // Store recent messages for SSE/polling fallback
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  addClient(client) {
    // Handle both old WebSocket style and new unified style
    if (client.type === 'sse') {
      this.clients.set(client.id, client);
    } else if (client.ws) {
      // WebSocket client (new style)
      this.clients.set(client.id, client);
    } else {
      // Legacy WebSocket client (old style)
      const clientData = {
        id: client.id || Math.random().toString(36).substring(2),
        ws: client,
        userName: arguments[2] || 'Anonymous', // userName from old addClient(id, ws, userName)
        joinedAt: new Date(),
        type: 'websocket'
      };
      this.clients.set(arguments[0], clientData); // clientId from old addClient(clientId, ws, userName)
    }
    this.lastActivity = new Date();
    console.log(`Client ${client.name || client.userName || arguments[2]} joined room ${this.id}`);
  }

  addStreamClient(clientId, ws) {
    this.streamClients.set(clientId, { ws, joinedAt: new Date() });
    this.lastActivity = new Date();
    console.log(`Stream client joined room ${this.id}`);
  }

  removeClient(clientId) {
    const removed = this.clients.delete(clientId) || this.streamClients.delete(clientId);
    if (removed) {
      console.log(`Client ${clientId} left room ${this.id}`);
    }
    return removed;
  }

  broadcast(message, excludeClientId = null) {
    this.lastActivity = new Date();
    
    // Store message for SSE/polling fallback
    this.messages.push({
      ...message,
      timestamp: Date.now()
    });
    
    // Keep only last 50 messages
    if (this.messages.length > 50) {
      this.messages = this.messages.slice(-50);
    }
    
    const messageStr = JSON.stringify(message);
    
    // Broadcast to chat clients (WebSocket and SSE)
    for (const [clientId, client] of this.clients) {
      if (clientId !== excludeClientId) {
        try {
          if (client.type === 'sse') {
            // Server-Sent Events
            client.response.write(`data: ${messageStr}\n\n`);
          } else if (client.ws && client.ws.readyState === 1) {
            // WebSocket
            client.ws.send(messageStr);
          }
        } catch (error) {
          console.error(`Error sending to client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    }
    
    // Broadcast to stream clients
    for (const [clientId, client] of this.streamClients) {
      if (client.ws.readyState === 1) {
        try {
          client.ws.send(messageStr);
        } catch (error) {
          console.error(`Error sending to stream client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    }
  }

  getMessagesSince(timestamp) {
    return this.messages.filter(msg => msg.timestamp > timestamp);
  }

  getClientCount() {
    return this.clients.size;
  }

  getStreamClientCount() {
    return this.streamClients.size;
  }

  isEmpty() {
    return this.clients.size === 0 && this.streamClients.size === 0;
  }
}

class Invite {
  constructor(token, roomId) {
    this.token = token;
    this.roomId = roomId;
    this.used = false;
    this.userIP = null;
  }
}

class Manager {
  constructor() {
    this.rooms = new Map();
    this.invites = new Map();
  }

  createRoom(id) {
    const room = new Room(id);
    this.rooms.set(id, room);
    return room;
  }

  getRoom(id) {
    return this.rooms.get(id);
  }

  createInvite(roomId) {
    const token = this.generateToken();
    const invite = new Invite(token, roomId);
    this.invites.set(token, invite);
    return invite;
  }

  getInvite(token) {
    return this.invites.get(token);
  }

  claimInvite(token, userIP) {
    const invite = this.invites.get(token);
    if (!invite) {
      return { room: null, success: false };
    }

    // Already used by someone else
    if (invite.used && invite.userIP !== userIP) {
      return { room: null, success: false };
    }

    // Claim it
    invite.used = true;
    invite.userIP = userIP;

    const room = this.rooms.get(invite.roomId);
    return { room, success: true };
  }

  checkInvite(token, userIP) {
    const invite = this.invites.get(token);
    if (!invite) {
      return { room: null, valid: false };
    }

    // Not used yet, or used by same IP
    if (!invite.used || invite.userIP === userIP) {
      const room = this.rooms.get(invite.roomId);
      return { room, valid: true };
    }

    return { room: null, valid: false };
  }

  generateToken() {
    return crypto.randomBytes(16).toString('base64url').slice(0, 22);
  }

  generateRoomId() {
    return crypto.randomBytes(4).toString('hex');
  }

  getAllRooms() {
    return this.rooms;
  }
}

module.exports = { Manager, Room, Invite };