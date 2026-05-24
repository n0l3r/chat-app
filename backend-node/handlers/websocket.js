const { censorMessage } = require('../utils/filter');

class WSHandler {
  constructor(manager) {
    this.manager = manager;
  }

  handleConnection = (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const token = pathParts[2];
    const userName = url.searchParams.get('name') || 'Anonymous';

    const { room, success } = this.manager.claimInvite(token);
    if (!success || !room) {
      ws.close(1008, 'Invalid or expired invite');
      return;
    }

    const clientId = Date.now() + Math.random();
    const client = { id: clientId, ws, name: userName, room, role: 'chat' };
    room.addClient(client);

    // Send current pin if exists
    if (room.pinnedMessage) {
      ws.send(JSON.stringify({ type: 'pin', pinnedMessage: room.pinnedMessage }));
    }

    // Notify admin stream about new user
    room.broadcastStatus();

    ws.on('message', (data) => {
      try {
        const incoming = JSON.parse(data.toString());
        if (!incoming.content || incoming.content.trim() === '') return;

        const chatMsg = {
          type: 'chat',
          name: userName,
          content: censorMessage(incoming.content.trim()),
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        const stored = room.storeMessage(chatMsg);
        room.broadcast(stored);
        room.broadcastStatus();
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });

    ws.on('close', () => {
      room.removeClient(clientId);
      room.broadcastStatus();

      const leaveMsg = {
        type: 'system',
        content: `${userName} left the chat`,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      room.broadcast(leaveMsg);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      room.removeClient(clientId);
      room.broadcastStatus();
    });
  };
}

class StreamHandler {
  constructor(manager) {
    this.manager = manager;
  }

  handleConnection = (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const roomId = pathParts[2];

    const room = this.manager.getRoom(roomId);
    if (!room) {
      ws.close(1008, 'Room not found');
      return;
    }

    const clientId = Date.now() + Math.random();
    const client = { id: clientId, ws, name: '__stream__', room, role: 'stream' };
    room.addClient(client);

    // Send history, current status and pin to new stream/admin viewer
    if (room.recentMessages.length > 0) {
      ws.send(JSON.stringify({ type: 'history', messages: room.recentMessages }));
    }
    ws.send(JSON.stringify({
      type: 'status',
      userCount: room.getUsers().length,
      users: room.getUsers(),
      messageCount: room._msgCounter
    }));
    if (room.pinnedMessage) {
      ws.send(JSON.stringify({ type: 'pin', pinnedMessage: room.pinnedMessage }));
    }

    ws.on('message', () => { /* stream is read-only */ });

    ws.on('close', () => {
      room.removeClient(clientId);
    });

    ws.on('error', (error) => {
      console.error('Stream WebSocket error:', error);
      room.removeClient(clientId);
    });
  };
}

module.exports = { WSHandler, StreamHandler };
