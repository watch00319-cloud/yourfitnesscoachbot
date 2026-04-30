const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const QRCode = require('qrcode');

const app = express();
const PORT = 3000;

let currentQR = null;

app.get('/qr', (req, res) => {
  if (!currentQR) {
    return res.json({ error: 'No QR available. Run npm start first.' });
  }
  
  QRCode.toDataURL(currentQR)
    .then(url => {
      res.json({ qrUrl: url, raw: currentQR });
    })
    .catch(err => res.json({ error: err.message }));
});

app.get('/qr.png', (req, res) => {
  if (!currentQR) {
    return res.status(404).send('No QR');
  }
  
  QRCode.toCanvas(createCanvas(300, 300), currentQR, { width: 300 })
    .then(canvas => {
      res.set('Content-Type', 'image/png');
      canvas.createPNGStream().pipe(res);
    });
});

// For Baileys integration
app.post('/set-qr', express.text(), (req, res) => {
  currentQR = req.body;
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🌐 QR Server: http://localhost:${PORT}/qr`);
  console.log(`🖼️ QR Image: http://localhost:${PORT}/qr.png`);
});

module.exports = app;

