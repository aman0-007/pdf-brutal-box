const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Standard SVG for normal icons (192x192, 512x512, apple-touch-icon)
const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="brutal-shadow" x="0" y="0" width="130%" height="130%">
      <feOffset dx="16" dy="16" in="SourceAlpha" result="offset" />
      <feFlood flood-color="#000000" />
      <feComposite in2="offset" operator="in" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="512" height="512" fill="#000000" />
  
  <!-- Subtle Grid Texture -->
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#181818" stroke-width="1.5" />
  </pattern>
  <rect width="512" height="512" fill="url(#grid)" />

  <!-- Outer Hard Border / Frame -->
  <rect x="20" y="20" width="472" height="472" fill="none" stroke="#262626" stroke-width="6" />

  <!-- Corner Brackets -->
  <path d="M 28 60 L 28 28 L 60 28" fill="none" stroke="#00E6FF" stroke-width="8" stroke-linecap="square" />
  <path d="M 484 60 L 484 28 L 452 28" fill="none" stroke="#00E6FF" stroke-width="8" stroke-linecap="square" />
  <path d="M 28 452 L 28 484 L 60 484" fill="none" stroke="#00E6FF" stroke-width="8" stroke-linecap="square" />
  <path d="M 484 452 L 484 484 L 452 484" fill="none" stroke="#00E6FF" stroke-width="8" stroke-linecap="square" />

  <!-- Shadow Block of Main Badge -->
  <rect x="96" y="86" width="336" height="356" rx="4" fill="#FFDE4D" />

  <!-- Main Brutalist White/Cyan Badge -->
  <rect x="80" y="70" width="336" height="356" rx="4" fill="#0D0D0D" stroke="#FFFFFF" stroke-width="10" />

  <!-- Cyan Accent Top Bar -->
  <rect x="80" y="70" width="336" height="48" fill="#00E6FF" stroke="#FFFFFF" stroke-width="10" />
  <circle cx="112" cy="94" r="7" fill="#000000" />
  <circle cx="136" cy="94" r="7" fill="#000000" />
  <circle cx="160" cy="94" r="7" fill="#000000" />
  <text x="390" y="101" font-family="'Courier New', monospace, sans-serif" font-weight="900" font-size="20" fill="#000000" text-anchor="end">SYS.01</text>

  <!-- Central PDF Document Graphic -->
  <!-- Document Folded Sheet -->
  <path d="M 140 160 L 290 160 L 350 220 L 350 370 L 140 370 Z" fill="#FFFFFF" stroke="#000000" stroke-width="8" stroke-linejoin="miter" />
  <!-- Folded Corner Corner Triangle -->
  <path d="M 290 160 L 290 220 L 350 220 Z" fill="#FFDE4D" stroke="#000000" stroke-width="8" stroke-linejoin="miter" />

  <!-- Bold Heavy "PDF" Monolith Text on Sheet -->
  <rect x="165" y="240" width="160" height="46" fill="#000000" />
  <text x="245" y="275" font-family="'Space Grotesk', 'Impact', sans-serif" font-weight="900" font-size="36" fill="#00E6FF" text-anchor="middle" letter-spacing="4">PDF</text>

  <!-- Functional Grid Bars on Document -->
  <rect x="165" y="302" width="160" height="10" fill="#000000" />
  <rect x="165" y="322" width="105" height="10" fill="#000000" />
  <rect x="282" y="322" width="43" height="10" fill="#FFDE4D" />
  <rect x="165" y="342" width="135" height="10" fill="#00E6FF" />

  <!-- Bottom Terminal Status Tag -->
  <text x="248" y="470" font-family="'Courier New', monospace" font-weight="900" font-size="18" fill="#00E6FF" text-anchor="middle" letter-spacing="3">// CLIENT_SIDE // 100% PRIVATE</text>
</svg>
`;

// Maskable SVG with safe 15% padding so circular/squircle crops don't cut anything
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Solid Bleed Background -->
  <rect width="512" height="512" fill="#0a0a0a" />

  <!-- Central Safe Zone Graphics (within radius 200 of center 256,256) -->
  <g transform="translate(32, 28) scale(0.87)">
    <!-- Shadow Block of Main Badge -->
    <rect x="96" y="86" width="336" height="356" rx="6" fill="#FFDE4D" />

    <!-- Main Brutalist Badge -->
    <rect x="80" y="70" width="336" height="356" rx="6" fill="#000000" stroke="#FFFFFF" stroke-width="12" />

    <!-- Cyan Header Bar -->
    <rect x="80" y="70" width="336" height="52" rx="2" fill="#00E6FF" stroke="#FFFFFF" stroke-width="12" />
    <circle cx="116" cy="96" r="8" fill="#000000" />
    <circle cx="142" cy="96" r="8" fill="#000000" />
    <circle cx="168" cy="96" r="8" fill="#000000" />
    <text x="390" y="103" font-family="'Courier New', monospace, sans-serif" font-weight="900" font-size="20" fill="#000000" text-anchor="end">BRUTAL</text>

    <!-- Document Graphic -->
    <path d="M 140 160 L 290 160 L 350 220 L 350 370 L 140 370 Z" fill="#FFFFFF" stroke="#000000" stroke-width="8" stroke-linejoin="miter" />
    <path d="M 290 160 L 290 220 L 350 220 Z" fill="#FFDE4D" stroke="#000000" stroke-width="8" stroke-linejoin="miter" />

    <!-- PDF Stamp -->
    <rect x="165" y="238" width="160" height="48" fill="#000000" />
    <text x="245" y="274" font-family="'Space Grotesk', 'Impact', sans-serif" font-weight="900" font-size="36" fill="#00E6FF" text-anchor="middle" letter-spacing="4">PDF</text>

    <!-- Geometric Code Lines -->
    <rect x="165" y="302" width="160" height="12" fill="#000000" />
    <rect x="165" y="324" width="105" height="12" fill="#000000" />
    <rect x="280" y="324" width="45" height="12" fill="#FFDE4D" />
    <rect x="165" y="346" width="130" height="12" fill="#00E6FF" />
  </g>
</svg>
`;

async function generateAll() {
  const root = path.resolve(__dirname, '..');
  
  // Save icon.svg
  fs.writeFileSync(path.join(root, 'icon.svg'), standardSvg.trim());
  console.log('Created icon.svg');

  // Generate pwa-192x192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(root, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // Generate pwa-512x512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(root, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Generate pwa-maskable-512x512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(root, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(root, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Generate favicon.png (64x64)
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(root, 'favicon.png'));
  console.log('Created favicon.png');

  console.log('All PWA icon assets successfully generated!');
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
