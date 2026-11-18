const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  const buffer = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    buffer[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[pxOffset] = r;
      buffer[pxOffset + 1] = g;
      buffer[pxOffset + 2] = b;
      buffer[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(buffer);

  function crc32(buf) {
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, toCrc, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function renderPwaIcon(size) {
  return createPng(size, size, (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const rMax = w * 0.48;

    // Outer mask
    if (dist > rMax) return [0, 0, 0, 0];

    // Background gradient: Soft Rose Pink to Deep Wine
    const t = (x + y) / (w + h);
    let r = Math.round(230 * (1 - t) + 100 * t);
    let g = Math.round(180 * (1 - t) + 36 * t);
    let b = Math.round(185 * (1 - t) + 68 * t);

    // Cute sparkling diamond/heart in the center
    const nx = Math.abs(dx) / (w * 0.28);
    const ny = Math.abs(dy) / (h * 0.28);
    // 4-point star formula: nx^0.5 + ny^0.5 <= 1
    if (Math.sqrt(nx) + Math.sqrt(ny) <= 1.0) {
      return [255, 255, 255, 255];
    }

    // Border ring
    if (dist > rMax - 4) {
      return [255, 255, 255, 220];
    }

    return [r, g, b, 255];
  });
}

const icon192 = renderPwaIcon(192);
const icon512 = renderPwaIcon(512);

fs.writeFileSync('icon-192.png', icon192);
fs.writeFileSync('public/icon-192.png', icon192);

fs.writeFileSync('icon-512.png', icon512);
fs.writeFileSync('public/icon-512.png', icon512);

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8B4B8"/>
      <stop offset="50%" stop-color="#D7BDB0"/>
      <stop offset="100%" stop-color="#642444"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="140" fill="url(#icon-grad)"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="8"/>
  <path d="M256 120 L285 220 L385 256 L285 292 L256 392 L227 292 L127 256 L227 220 Z" fill="#FFFFFF"/>
  <circle cx="370" cy="140" r="16" fill="#FFFFFF"/>
  <circle cx="140" cy="370" r="14" fill="#FFFFFF"/>
</svg>`;

fs.writeFileSync('icon.svg', svgIcon);
fs.writeFileSync('public/icon.svg', svgIcon);

console.log('PWA icons created successfully! (192px, 512px, svg)');
