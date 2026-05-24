const crypto = require('crypto');

class Room {
  constructor(id) {
    this.id = id;
    this.clients = new Map();
    this.pinnedMessage = null;
    this.recentMessages = [];
    this._msgCounter = 0;
  }

  addClient(client) {
    this.clients.set(client.id, client);
  }

  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  storeMessage(msg) {
    const msgWithId = { ...msg, id: ++this._msgCounter };
    this.recentMessages.push(msgWithId);
    if (this.recentMessages.length > 50) this.recentMessages.shift();
    return msgWithId;
  }

  getUsers() {
    const users = [];
    for (const [, client] of this.clients) {
      if (client.role === 'chat') users.push(client.name);
    }
    return users;
  }

  // Send message only to stream/admin viewers
  notifyStreams(msg) {
    const payload = JSON.stringify(msg);
    for (const [, client] of this.clients) {
      if (client.role === 'stream' && client.ws.readyState === 1) {
        client.ws.send(payload);
      }
    }
  }

  broadcastStatus() {
    this.notifyStreams({
      type: 'status',
      userCount: this.getUsers().length,
      users: this.getUsers(),
      messageCount: this._msgCounter
    });
  }

  // Send to all (chat + stream), excluding optional id
  broadcast(message, excludeId = null) {
    const payload = JSON.stringify(message);
    for (const [id, client] of this.clients) {
      if (id !== excludeId && client.ws.readyState === 1) {
        client.ws.send(payload);
      }
    }
  }

  setPinnedMessage(message) {
    this.pinnedMessage = message;
    this.broadcast({ type: 'pin', pinnedMessage: message });
  }

  clearPinnedMessage() {
    this.pinnedMessage = null;
    this.broadcast({ type: 'unpin' });
  }

  getClientCount() {
    return this.clients.size;
  }
}

class Invite {
  constructor(token, roomId) {
    this.token = token;
    this.roomId = roomId;
  }
}

class Manager {
  constructor() {
    this.rooms = new Map();
    this.invites = new Map();
  }

  createRoom(id) {
    // Close all existing rooms before creating a new one
    for (const [existingId, existingRoom] of this.rooms) {
      existingRoom.broadcast({ type: 'system', content: 'Room closed by admin.' });
      for (const [, client] of existingRoom.clients) {
        if (client.ws.readyState === 1) client.ws.close(1000, 'Room closed');
      }
      this.rooms.delete(existingId);
    }

    const room = new Room(id);
    this.rooms.set(id, room);
    return room;
  }

  getRoom(id) {
    return this.rooms.get(id);
  }

  getRooms() {
    const result = [];
    for (const [id, room] of this.rooms) {
      result.push({
        id,
        clientCount: room.getClientCount(),
        pinnedMessage: room.pinnedMessage
      });
    }
    return result;
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

  claimInvite(token) {
    const invite = this.invites.get(token);
    if (!invite) return { room: null, success: false };

    const room = this.rooms.get(invite.roomId);
    if (!room) return { room: null, success: false };

    return { room, success: true };
  }

  checkInvite(token) {
    const invite = this.invites.get(token);
    if (!invite) return { room: null, valid: false };

    const room = this.rooms.get(invite.roomId);
    if (!room) return { room: null, valid: false };

    return { room, valid: true };
  }

  generateToken() {
    return crypto.randomBytes(16).toString('base64url').slice(0, 22);
  }

  generateRoomId() {
    return crypto.randomBytes(4).toString('hex');
  }
}

module.exports = { Manager, Room, Invite };
