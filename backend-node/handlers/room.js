const QRCode = require('qrcode');
const { addWord, removeWord, getWords } = require('../utils/filter');

class RoomHandler {
  constructor(manager, baseURL) {
    this.manager = manager;
    this.baseURL = baseURL;
  }

  createRoom = async (req, res) => {
    try {
      const roomId = this.manager.generateRoomId();
      this.manager.createRoom(roomId);

      const invite = this.manager.createInvite(roomId);

      res.status(201).json({
        room_id: roomId,
        token: invite.token,
        chat_url: `${this.baseURL}/c/${invite.token}`,
        stream_url: `${this.baseURL}/s/${roomId}`,
        qr_url: `/api/qr/${invite.token}`
      });
    } catch {
      res.status(500).json({ error: 'Failed to create room' });
    }
  };

  addInvite = async (req, res) => {
    try {
      const room = this.manager.getRoom(req.params.roomId);
      if (!room) return res.status(404).json({ error: 'Room not found' });

      const invite = this.manager.createInvite(req.params.roomId);

      res.status(201).json({
        token: invite.token,
        chat_url: `${this.baseURL}/c/${invite.token}`,
        qr_url: `/api/qr/${invite.token}`
      });
    } catch {
      res.status(500).json({ error: 'Failed to create invite' });
    }
  };

  getQRCode = async (req, res) => {
    try {
      const invite = this.manager.getInvite(req.params.token);
      if (!invite) return res.status(404).json({ error: 'Invalid token' });

      const chatURL = `${this.baseURL}/c/${req.params.token}`;
      const pngBuffer = await QRCode.toBuffer(chatURL, { width: 256 });

      res.setHeader('Content-Type', 'image/png');
      res.send(pngBuffer);
    } catch {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  };

  // --- Room list ---

  getRooms = (req, res) => {
    res.json({ rooms: this.manager.getRooms() });
  };

  // --- Pin management ---

  getPinnedMessage = (req, res) => {
    const room = this.manager.getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ pinnedMessage: room.pinnedMessage });
  };

  pinMessage = (req, res) => {
    const room = this.manager.getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { content, name } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content required' });
    }

    const message = {
      content: content.trim(),
      name: (name || 'Admin').trim(),
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    room.setPinnedMessage(message);
    res.json({ pinnedMessage: message });
  };

  unpinMessage = (req, res) => {
    const room = this.manager.getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    room.clearPinnedMessage();
    res.json({ success: true });
  };

  // --- Censored words management ---

  getWords = (req, res) => {
    res.json({ words: getWords() });
  };

  addWord = (req, res) => {
    const { word } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'Word required' });
    }
    const added = addWord(word.trim());
    if (!added) return res.status(409).json({ error: 'Word already exists' });
    res.status(201).json({ words: getWords() });
  };

  removeWord = (req, res) => {
    const word = decodeURIComponent(req.params.word);
    const removed = removeWord(word);
    if (!removed) return res.status(404).json({ error: 'Word not found' });
    res.json({ words: getWords() });
  };
}

module.exports = RoomHandler;
