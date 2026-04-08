const WebSocket = require('ws');
const { censorMessage } = require('../utils/filter');

class WSHandler {
  constructor(manager) {
    this.manager = manager;
  }

  handleConnection = (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const token = pathParts[2]; // /ws/TOKEN
    const userName = url.searchParams.get('name') || 'Anonymous';
    const userIP = req.socket.remoteAddress;

    // Claim the invite (single-use)
    const { room, success } = this.manager.claimInvite(token, userIP);
    
    if (!success || !room) {
      ws.close(1008, 'Invite already used or invalid');
      return;
    }

    const clientId = Date.now() + Math.random();
    const client = {
      id: clientId,
      ws: ws,
      name: userName,
      room: room
    };

    room.addClient(client);

    // Send join message
    const joinMsg = {
      type: 'system',
      name: userName,
      content: `${userName} joined the chat`,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    room.broadcast(joinMsg);

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const incoming = JSON.parse(data.toString());
        
        if (!incoming.content || incoming.content.trim() === '') {
          return;
        }

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

        room.broadcast(chatMsg);
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      room.removeClient(clientId);

      const leaveMsg = {
        type: 'system',
        name: userName,
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
    const roomId = pathParts[2]; // /ws-stream/ROOMID
    
    const room = this.manager.getRoom(roomId);
    
    if (!room) {
      ws.close(1008, 'Room not found');
      return;
    }

    const clientId = Date.now() + Math.random();
    const client = {
      id: clientId,
      ws: ws,
      name: '__stream__',
      room: room
    };

    room.addClient(client);

    // Stream viewer is read-only, ignore incoming messages
    ws.on('message', () => {
      // Ignore all incoming messages
    });

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