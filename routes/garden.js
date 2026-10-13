const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  const router = express.Router();

  // ── POST /api/garden  — create a new garden (free) ──
  router.post('/', (req, res) => {
    const { sender, recipient, msgType, message, theme, pattern, density } = req.body;
    if (!sender || !recipient || !message) {
      return res.status(400).json({ error: 'sender, recipient and message are required' });
    }
    const id      = uuidv4();
    const shareId = id.split('-')[0];
    const garden  = {
      id, shareId,
      sender, recipient, msgType, message,
      theme:   theme   ?? 0,
      pattern: pattern ?? 0,
      density: density ?? 2,
      createdAt: Date.now(),
    };
    db.get('gardens').push(garden).write();
    res.json({ id, shareId });
  });

  // ── GET /api/garden/:shareId  — fetch a garden ──
  router.get('/:shareId', (req, res) => {
    const garden = db.get('gardens').find({ shareId: req.params.shareId }).value();
    if (!garden) return res.status(404).json({ error: 'Garden not found' });
    res.json(garden);
  });

  // ── GET /api/garden/:shareId/whatsapp  — build WhatsApp share link ──
  router.get('/:shareId/whatsapp', (req, res) => {
    const { phone } = req.query;
    const garden = db.get('gardens').find({ shareId: req.params.shareId }).value();
    if (!garden) return res.status(404).json({ error: 'Garden not found' });

    const base  = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
    const link  = `${base}/garden/${garden.shareId}`;
    const emoji = { love:'💕', congratulations:'🎉', apology:'🕊️', condolences:'🤍', birthday:'🎂', gratitude:'🙏' };
    const icon  = emoji[garden.msgType] || '🌸';

    const text = [
      `${icon} *A blooming garden for you, ${garden.recipient}!*`,
      ``,
      `_${garden.message.split('\n')[0]}_`,
      ``,
      `🌸 Open your personal garden here:`,
      link,
      ``,
      `_Sent with Bloom — made with love by ${garden.sender}_`,
    ].join('\n');

    const encoded = encodeURIComponent(text);
    const waPhone = phone ? phone.replace(/[^\d]/g, '') : '';
    const waLink  = waPhone
      ? `https://wa.me/${waPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    res.json({ waLink, gardenLink: link, text });
  });

  return router;
};
