const QRCode = require('qrcode');

class RoomHandler {
  constructor(manager, baseURL) {
    this.manager = manager;
    this.baseURL = baseURL;
  }

  createRoom = async (req, res) => {
    try {
      const roomId = this.manager.generateRoomId();
      this.manager.createRoom(roomId);

      // Create first invite
      const invite = this.manager.createInvite(roomId);

      const response = {
        room_id: roomId,
        token: invite.token,
        chat_url: `${this.baseURL}/c/${invite.token}`,
        stream_url: `${this.baseURL}/s/${roomId}`,
        qr_url: `/api/qr/${invite.token}`
      };

      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create room' });
    }
  };

  addInvite = async (req, res) => {
    try {
      const roomId = req.params.roomId;
      const room = this.manager.getRoom(roomId);

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const invite = this.manager.createInvite(roomId);

      const response = {
        token: invite.token,
        chat_url: `${this.baseURL}/c/${invite.token}`,
        qr_url: `/api/qr/${invite.token}`
      };

      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create invite' });
    }
  };

  getQRCode = async (req, res) => {
    try {
      const token = req.params.token;
      const invite = this.manager.getInvite(token);

      if (!invite) {
        return res.status(404).json({ error: 'Invalid token' });
      }

      const chatURL = `${this.baseURL}/c/${token}`;
      const pngBuffer = await QRCode.toBuffer(chatURL, { width: 256 });

      res.setHeader('Content-Type', 'image/png');
      res.send(pngBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  };
}

module.exports = RoomHandler;