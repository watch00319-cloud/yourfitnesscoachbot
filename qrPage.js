function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderQrPage({ hasQr, connected, status, port } = {}) {
  const safeStatus = escapeHtml(status || 'Starting...');
  const dashboardUrl = port ? `http://localhost:${port}` : '/';
  const body = hasQr
    ? `<h1>Scan this QR</h1>
       <img class="qr" src="/qr.png?t=${Date.now()}" alt="WhatsApp QR code">
       <p>Open WhatsApp > Linked Devices > Link a Device.</p>`
    : connected
      ? `<h1>Bot is already connected</h1>
         <p>QR is hidden because WhatsApp is already linked.</p>
         <p>To generate a new QR, the saved auth session must be reset first.</p>`
      : `<h1>Waiting for QR</h1>
         <p>No QR is available yet. Keep this page open; it refreshes automatically.</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Bot QR</title>
  <meta http-equiv="refresh" content="3">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: Arial, sans-serif;
      background: #f4f6f8;
      color: #1f2937;
    }
    main {
      width: min(92vw, 440px);
      padding: 28px;
      background: white;
      border: 1px solid #d7dde3;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
    }
    h1 {
      margin: 0 0 14px;
      font-size: 24px;
    }
    p {
      margin: 10px 0;
      line-height: 1.45;
    }
    .qr {
      width: min(78vw, 340px);
      height: auto;
      border: 1px solid #d7dde3;
      border-radius: 8px;
    }
    .status {
      margin-top: 18px;
      padding: 10px;
      background: #eef2f7;
      border-radius: 6px;
      font-size: 14px;
      overflow-wrap: anywhere;
    }
    a {
      color: #047857;
      text-decoration: none;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main>
    ${body}
    <div class="status">Status: ${safeStatus}</div>
    <p><a href="${escapeHtml(dashboardUrl)}">Open dashboard</a></p>
  </main>
</body>
</html>`;
}

module.exports = { renderQrPage };
