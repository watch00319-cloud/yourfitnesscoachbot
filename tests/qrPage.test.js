const assert = require('assert');
const { renderQrPage } = require('../qrPage');

function testQrImageOnlyRendersWhenAvailable() {
  const html = renderQrPage({
    hasQr: false,
    connected: true,
    status: 'Connected'
  });

  assert(!html.includes('src="/qr.png"'));
  assert(html.includes('already connected'));
}

function testQrImageRendersWhenAvailable() {
  const html = renderQrPage({
    hasQr: true,
    connected: false,
    status: 'QR Ready'
  });

  assert(html.includes('src="/qr.png'));
  assert(html.includes('Scan this QR'));
}

testQrImageOnlyRendersWhenAvailable();
testQrImageRendersWhenAvailable();
console.log('qr page tests passed');
