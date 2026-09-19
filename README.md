# 🗄️ PDF // BRUTAL_BOX

![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25_Client--Side-00E6FF?style=flat-square)
![PWA: Offline Ready](https://img.shields.io/badge/PWA-Offline_Ready-00E676?style=flat-square)
![Crypto: Web_Crypto_AES--256](https://img.shields.io/badge/Crypto-Web_Crypto_AES--256-FFDE4D?style=flat-square)
![Tech: Vanilla_JS_+_HTML5](https://img.shields.io/badge/Tech-Vanilla_JS_+_HTML5-black?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-white?style=flat-square)

A zero-compromise, serverless, privacy-first PDF manipulation workshop engineered entirely for the modern web browser. **PDF // BRUTAL_BOX** guarantees **absolute privacy**: no cloud servers, no third-party APIs, no telemetry, and **zero data leaks**. Every document is parsed, rendered, transformed, and encrypted strictly within your browser's local sandbox memory.

Turn off your Wi-Fi, disconnect your Ethernet, or board an airplane—the application remains 100% operational.

---

## ⚡ Complete Tool Suite (12 Modules)

| # | Tool | Description |
|---|---|---|
| **01** | **Merge PDF** | Combine multiple documents into one. Reorder, preview, or remove files before assembling. |
| **02** | **Rotate / Delete** | Interactive page grid to rotate individual pages (90° clockwise) or purge unwanted pages. |
| **03** | **Image ➔ PDF** | Batch convert images (`PNG`, `JPG`, `WebP`) into a single structured, high-resolution PDF document. |
| **04** | **PDF ➔ Image** | Shred document pages into sharp PNG/JPG image assets and download them individually or as a `.zip` archive. |
| **05** | **Split / Extract** | Slice documents by custom intervals or extract targeted page ranges into standalone files. |
| **06** | **Watermark** | Overlay customizable text or transparent logos across all pages with opacity, sizing, and position controls. |
| **07** | **E-Signature** | Precision digital signature tool with an HTML5 drawing canvas, PNG file upload, and 4-corner placement controls. |
| **08** | **Reorder Pages** | Fluid HTML5 drag-and-drop canvas for instantly shuffling and reorganizing page sequences. |
| **09** | **Compress** | Optimize PDF object streams and strip redundant structural bloat entirely in browser memory. |
| **10** | **Auto-Stamper** | Batch page numbering engine with format tokens (`{n}`, `{total}`), 9–24pt sizing, border badges, and offset margins. |
| **11** | **Nuke Metadata (Ghost Mode)** | Purge title, author, producer, creation/modification dates, and hidden XML metadata footprints. |
| **12** | **Encrypt & Protect** | Military-grade **AES-256** (PDF 2.0) and legacy **RC4-128** encryption with custom passwords and granular permissions (print, copy, edit). |

---

## 📱 Progressive Web App (PWA) & Offline Mode

**PDF // BRUTAL_BOX** is a fully certified, installable Progressive Web App built to modern Chromium, WebKit, and Gecko standards.

* **Offline Capabilities**: Core assets, stylesheets, scripts, and heavy cryptographic and rendering libraries are pre-cached for offline resiliency.
* **Standalone Window Execution**: Operates without browser navigation bars or address strips, delivering a native desktop/mobile utility experience.
* **Seamless Offline Execution**: Core assets, stylesheets, scripts, and client-side cryptographic and rendering libraries are pre-cached by the Service Worker for 100% offline capability without requiring any separate mode or internet connection.
* **Adaptive Icons**: Includes crisp 192×192px and 512×512px standard icons, 180×180px Apple Touch Icon, and a 512×512px maskable icon with calibrated safe-zone padding.

---

## 🛠️ Advanced Interaction Architecture

* **High-Resolution Page Inspector (Lightbox)**: Inspect any page thumbnail in full crisp resolution with previous/next controls, page counters, and keyboard navigation (`Esc`, `←`, `→`).
* **Non-Blocking Batched Thumbnail Renderer**: Heavy multi-page documents render in small, non-blocking asynchronous batches (3 pages at a time) with visual progress feedback, keeping the UI silky smooth.
* **Full-Window Drag & Drop**: Drag a PDF anywhere onto the active tool screen to immediately load it into the engine.
* **Brutalist Toast System**: High-contrast, non-intrusive status notifications provide instant feedback on file parsing, processing progress, and download readiness.

---

## 🔒 Privacy & Cryptography Guarantees

1. **Zero Data Transmission**: No files or metadata ever leave your computer or device. Network inspection (`F12 ➔ Network`) confirms zero file upload payloads.
2. **Web Crypto Pipeline**: The encryption engine leverages the native browser `crypto.subtle` API for AES-256 bit Galois/Counter Mode (GCM) and Cipher Block Chaining (CBC) operations.
3. **In-Memory Buffer Garbage Collection**: Document buffers are handled in temporary TypedArrays (`Uint8Array`) and freed when operations complete or when the workspace is reset.

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Node.js 18+ (tested on Node v20/v22)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/pdf-brutal-box.git
cd pdf-brutal-box

# Install dependencies
npm install
```

### Running Locally
```bash
# Start the local development server
npm run dev
# Or run with production command
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Generating PWA Icon Assets
To regenerate high-resolution PWA icons (`icon.svg`, `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, `favicon.png`):
```bash
npm run build
```

---

## 🏗️ Technical Stack

* **Rendering Engine**: [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla)
* **Manipulation Engine**: [pdf-lib](https://pdf-lib.js.org/)
* **Encryption Engine**: [@pdfsmaller/pdf-encrypt](https://www.npmjs.com/package/@pdfsmaller/pdf-encrypt) (Native Web Crypto AES-256 & RC4)
* **Archival Engine**: [JSZip](https://stuk.github.io/jszip/)
* **PWA & Offline Pipeline**: Custom Service Worker + Web App Manifest + Sharp Asset Generation
* **Typography**: Space Grotesk & Syne via Google Fonts
* **Styling**: Pure Brutalist CSS (High contrast, hard geometry, raw system status metrics)

---

## 📄 License

Distributed under the **MIT License**. Free for personal, commercial, and educational use.
