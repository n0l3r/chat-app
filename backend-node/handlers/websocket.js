const WebSocket = require('ws');
const { censorMessage } = require('../utils/filter');

class WSHandler {
  constructor(manager) {
    this.manager = manager;
  }

  handleConnection = (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathParts = url.pathname.split('/');
      const token = pathParts[2]; // /ws/TOKEN
      const userName = url.searchParams.get('name') || 'Anonymous';
      const userIP = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

      console.log(`Chat WebSocket: token=${token}, user=${userName}, ip=${userIP}`);

      // Claim the invite (single-use)
      const { room, success } = this.manager.claimInvite(token, userIP);
      
      if (!success || !room) {
        console.log('Invalid invite claim');
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
      console.log(`User ${userName} joined room ${room.id}`);

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
        console.log(`User ${userName} left room ${room.id}`);
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

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Server error');
    }
  };
}

class StreamHandler {
  constructor(manager) {
    this.manager = manager;
  }

  handleConnection = (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathParts = url.pathname.split('/');
      const roomId = pathParts[2]; // /ws-stream/ROOMID
      
      console.log(`Stream WebSocket: roomId=${roomId}`);
      
      const room = this.manager.getRoom(roomId);
      
      if (!room) {
        console.log('Room not found for stream');
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
      console.log(`Stream connected to room ${roomId}`);

      // Stream viewer is read-only, ignore incoming messages
      ws.on('message', () => {
        // Ignore all incoming messages
      });

      ws.on('close', () => {
        console.log(`Stream disconnected from room ${roomId}`);
        room.removeClient(clientId);
      });

      ws.on('error', (error) => {
        console.error('Stream WebSocket error:', error);
        room.removeClient(clientId);
      });

    } catch (error) {
      console.error('Stream WebSocket connection error:', error);
      ws.close(1011, 'Server error');
    }
  };
}

module.exports = { WSHandler, StreamHandler };