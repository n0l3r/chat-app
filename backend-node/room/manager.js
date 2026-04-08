const crypto = require('crypto');

class Room {
  constructor(id) {
    this.id = id;
    this.clients = new Map();
  }

  addClient(client) {
    this.clients.set(client.id, client);
  }

  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  broadcast(message, excludeId = null) {
    for (const [id, client] of this.clients) {
      if (id !== excludeId && client.ws.readyState === 1) { // OPEN
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  getClientCount() {
    return this.clients.size;
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
}

module.exports = { Manager, Room, Invite };