const fs = require('fs');
const path = require('path');
const { encode } = require('fast-png');

// 1. Generate SVG Favicon (Vector, infinite resolution, crisp on Retina displays)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="eclesia-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#3730A3" />
    </linearGradient>
  </defs>
  <!-- Squircle rounded background -->
  <rect width="64" height="64" rx="16" fill="url(#eclesia-grad)" />
  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="15.25" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1.5" />
  <!-- Church Emblem -->
  <g transform="translate(14, 14) scale(1.5)" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2" />
    <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
    <path d="M18 22V5l-6-3-6 3v17" />
    <path d="M12 7v5" stroke-width="2.4" />
    <path d="M9.5 9.5h5" stroke-width="2.4" />
  </g>
</svg>
`;

// 2. Generate 32x32 and 16x16 raster bitmaps for standard .ico container
function createBitmap(size) {
  const width = size;
  const height = size;
  const data = new Uint8ClampedArray(width * height * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    // Alpha blending
    const curA = data[idx + 3] / 255;
    const newA = a / 255;
    const outA = newA + curA * (1 - newA);
    if (outA > 0) {
      data[idx] = Math.round((r * newA + data[idx] * curA * (1 - newA)) / outA);
      data[idx + 1] = Math.round((g * newA + data[idx + 1] * curA * (1 - newA)) / outA);
      data[idx + 2] = Math.round((b * newA + data[idx + 2] * curA * (1 - newA)) / outA);
      data[idx + 3] = Math.round(outA * 255);
    }
  }

  function drawLine(x0, y0, x1, y1, r, g, b, a = 255, thickness = 1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
      for (let tx = -Math.floor((thickness - 1) / 2); tx <= Math.ceil((thickness - 1) / 2); tx++) {
        for (let ty = -Math.floor((thickness - 1) / 2); ty <= Math.ceil((thickness - 1) / 2); ty++) {
          setPixel(cx + tx, cy + ty, r, g, b, a);
        }
      }
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  const radius = Math.round(size * 0.25);
  // Fill rounded background with gradient
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let isInside = true;
      if (x < radius && y < radius) {
        const d = Math.hypot(x - radius, y - radius);
        if (d > radius) isInside = false;
      } else if (x >= width - radius && y < radius) {
        const d = Math.hypot(x - (width - radius - 1), y - radius);
        if (d > radius) isInside = false;
      } else if (x < radius && y >= height - radius) {
        const d = Math.hypot(x - radius, y - (height - radius - 1));
        if (d > radius) isInside = false;
      } else if (x >= width - radius && y >= height - radius) {
        const d = Math.hypot(x - (width - radius - 1), y - (height - radius - 1));
        if (d > radius) isInside = false;
      }

      if (isInside) {
        const t = (x + y) / (width + height);
        // Gradient #6366F1 (99, 102, 241) to #3730A3 (55, 48, 163)
        const cr = Math.round(99 + (55 - 99) * t);
        const cg = Math.round(102 + (48 - 102) * t);
        const cb = Math.round(241 + (163 - 241) * t);
        setPixel(x, y, cr, cg, cb, 255);
      }
    }
  }

  // Draw church lines
  const scale = size / 32;
  const s = (val) => Math.round(val * scale);

  const th = Math.max(1, Math.round(scale * 1.5));
  // Central roof peak: (16, 5) -> (10, 10) & (22, 10)
  drawLine(s(16), s(5), s(10), s(10), 255, 255, 255, 255, th);
  drawLine(s(16), s(5), s(22), s(10), 255, 255, 255, 255, th);

  // Central tower walls: (10, 10) -> (10, 26) & (22, 10) -> (22, 26)
  drawLine(s(10), s(10), s(10), s(26), 255, 255, 255, 255, th);
  drawLine(s(22), s(10), s(22), s(26), 255, 255, 255, 255, th);

  // Side roofs: (10, 13) -> (5, 15) & (22, 13) -> (27, 15)
  drawLine(s(10), s(13), s(5), s(15), 255, 255, 255, 255, th);
  drawLine(s(22), s(13), s(27), s(15), 255, 255, 255, 255, th);

  // Side walls: (5, 15) -> (5, 26) & (27, 15) -> (27, 26)
  drawLine(s(5), s(15), s(5), s(26), 255, 255, 255, 255, th);
  drawLine(s(27), s(15), s(27), s(26), 255, 255, 255, 255, th);

  // Base floor
  drawLine(s(5), s(26), s(27), s(26), 255, 255, 255, 255, th);

  // Central Cross
  // Vertical
  drawLine(s(16), s(10), s(16), s(16), 255, 255, 255, 255, th);
  // Horizontal
  drawLine(s(13), s(12), s(19), s(12), 255, 255, 255, 255, th);

  // Door
  drawLine(s(13), s(26), s(13), s(21), 255, 255, 255, 255, th);
  drawLine(s(19), s(26), s(19), s(21), 255, 255, 255, 255, th);
  drawLine(s(13), s(21), s(19), s(21), 255, 255, 255, 255, th);

  return encode({ width, height, data });
}

// 3. Package PNGs into multi-image Windows .ico format
function createIco(images) {
  // Header: 6 bytes
  // Count: images.length
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type (1 = ICO)
  header.writeUInt16LE(images.length, 4); // Number of images

  let currentOffset = 6 + images.length * 16;
  const dirEntries = [];
  const buffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Image data offset

    dirEntries.push(entry);
    buffers.push(img.buffer);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...buffers]);
}

// Generate files
const png32 = createBitmap(32);
const png16 = createBitmap(16);
const png48 = createBitmap(48);
const icoBuffer = createIco([
  { width: 48, height: 48, buffer: png48 },
  { width: 32, height: 32, buffer: png32 },
  { width: 16, height: 16, buffer: png16 },
]);

// Write to public/ and dist/
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'favicon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(distDir, 'favicon.ico'), icoBuffer);
}

console.log('✓ Favicons gerados com sucesso em public/ e dist/!');
console.log('  - favicon.svg (Vetor alta resolucao)');
console.log('  - favicon.ico (Multi-tamanho 16x16, 32x32, 48x48)');
