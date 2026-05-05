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

  const initialHeading = hasQr
    ? 'Scan this QR'
    : connected
      ? 'Bot is already connected'
      : 'Waiting for QR';

  const initialBody = hasQr
    ? `<img class="qr" id="qr-img" src="/qr.png?t=${Date.now()}" alt="WhatsApp QR code">
       <p>Open WhatsApp &gt; Linked Devices &gt; Link a Device.</p>`
    : connected
      ? `<p>QR is hidden because WhatsApp is already linked.</p>
         <p>To generate a new QR, the saved auth session must be reset first.</p>`
      : `<img class="qr" id="qr-img" src="" alt="WhatsApp QR code" style="display:none">
         <p id="waiting-msg">No QR is available yet. Checking automatically&hellip;</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Bot QR</title>
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
    <h1 id="heading">${escapeHtml(initialHeading)}</h1>
    ${initialBody}
    <div class="status" id="status-text">Status: ${safeStatus}</div>
    <p><a href="${escapeHtml(dashboardUrl)}">Open dashboard</a></p>
  </main>
  <script>
    (function () {
      var qrRefreshInterval = null;

      function refreshQrImage() {
        var img = document.getElementById('qr-img');
        if (img) {
          img.src = '/qr.png?t=' + Date.now();
        }
      }

      function applyState(data) {
        var heading = document.getElementById('heading');
        var statusText = document.getElementById('status-text');
        var waitingMsg = document.getElementById('waiting-msg');
        var img = document.getElementById('qr-img');

        if (statusText && data.status) {
          statusText.textContent = 'Status: ' + data.status;
        }

        if (data.connected) {
          if (heading) heading.textContent = 'Bot is already connected';
          if (img) img.style.display = 'none';
          if (waitingMsg) waitingMsg.style.display = 'none';
          if (qrRefreshInterval) {
            clearInterval(qrRefreshInterval);
            qrRefreshInterval = null;
          }
        } else if (data.qr) {
          if (heading) heading.textContent = 'Scan this QR';
          if (waitingMsg) waitingMsg.style.display = 'none';
          if (img) {
            img.src = '/qr.png?t=' + Date.now();
            img.style.display = '';
          }
          if (!qrRefreshInterval) {
            qrRefreshInterval = setInterval(refreshQrImage, 2000);
          }
        } else {
          if (heading) heading.textContent = 'Waiting for QR';
          if (img) img.style.display = 'none';
          if (waitingMsg) waitingMsg.style.display = '';
          if (qrRefreshInterval) {
            clearInterval(qrRefreshInterval);
            qrRefreshInterval = null;
          }
        }
      }

      function poll() {
        fetch('/api/status')
          .then(function (r) { return r.json(); })
          .then(function (data) { applyState(data); })
          .catch(function () { /* ignore transient errors */ });
      }

      setInterval(poll, 1000);
      poll();
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderQrPage };
