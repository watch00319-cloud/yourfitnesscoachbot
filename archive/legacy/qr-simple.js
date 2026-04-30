const http = require('http');
const QRCode = require('qrcode');

let currentQR = null;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  
  if (req.url === '/qr' && req.method === 'GET' && currentQR) {
    QRCode.toDataURL(currentQR)
      .then(url => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ qrUrl: url, raw: currentQR }));
      })
      .catch(() => res.writeHead(404).end('No QR'));
  } else if (req.url === '/qr.png' && currentQR) {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    QRCode.toFileStream(res, currentQR, { width: 300 });
  } else if (req.url === '/set-qr' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      currentQR = body;
      res.end('QR Updated');
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Bot QR Scanner</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; background: #f0f2f5; text-align: center; }
    .qr-container { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin: 20px 0; }
    img { max-width: 300px; height: auto; border-radius: 10px; }
    h1 { color: #25D366; margin-bottom: 10px; }
    #status { font-size: 18px; font-weight: bold; margin: 20px 0; }
    .loading { color: #666; }
    .ready { color: #25D366; }
    code { background: #333; color: white; padding: 5px 10px; border-radius: 5px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="qr-container">
    <h1>🤖 WhatsApp QR Login</h1>
    <img id="qrimg" src="/qr.png?t=${Date.now()}" style="display:none;">
    <p id="status" class="loading">Connecting to bot... <br> Run <code>npm start</code> in terminal</p>
    <p>Open this page on phone: <strong>http://localhost:3000</strong></p>
  </div>
  <script>
    function pollQR() {
      fetch('/qr')
        .then(r => r.json())
        .then(data => {
          if (data.qrUrl) {
            document.getElementById('qrimg').src = data.qrUrl + '?t=' + Date.now();
            document.getElementById('qrimg').style.display = 'block';
            document.getElementById('status').innerHTML = '<span class="ready">✅ QR Ready! SCAN NOW (20s)</span>';
            document.getElementById('status').className = 'ready';
          } else {
            setTimeout(pollQR, 1500);
          }
        })
        .catch(() => setTimeout(pollQR, 1500));
    }
    pollQR();
  </script>
</body>
</html>
    `);
  }
});

server.listen(3000, () => {
  console.log('\\n🌐 WhatsApp QR Server Live!');
  console.log('📱 Phone: http://localhost:3000');
  console.log('🖼️  PNG: http://localhost:3000/qr.png');
  console.log('📄  JSON: http://localhost:3000/qr');
  console.log('🚀 Run "npm start" next!\\n');
});

// For bot integration
module.exports.setQR = (qr) => { currentQR = qr; };

