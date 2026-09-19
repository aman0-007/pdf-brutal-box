pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const BrutalIcons = {
    file: `<svg class="inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    image: `<svg class="inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    close: `<svg class="inline-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    spinner: `<svg class="inline-svg spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    check: `<svg class="inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
    warning: `<svg class="inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    shield: `<svg class="inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>`,
    lock: `<svg class="inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    inspect: `<svg class="inline-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
    up: `<svg class="inline-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>`,
    down: `<svg class="inline-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>`
};

const App = { currentTool: 'tool-merge' };

// Brutalist Toast Notification System
function showBrutalToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('brutal-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'brutal-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `brutal-toast toast-${type}`;
    
    let iconSvg = BrutalIcons.file;
    if (type === 'success') iconSvg = BrutalIcons.check;
    else if (type === 'error') iconSvg = BrutalIcons.warning;
    else if (type === 'warning') iconSvg = BrutalIcons.warning;
    else if (type === 'shield') iconSvg = BrutalIcons.shield;

    toast.innerHTML = `
        <div class="brutal-toast-content">
            ${iconSvg}
            <span>${message}</span>
        </div>
        <button class="brutal-toast-close" title="Dismiss">${BrutalIcons.close}</button>
    `;

    const closeBtn = toast.querySelector('.brutal-toast-close');
    const dismiss = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.95)';
        toast.style.transition = 'all 0.15s ease';
        setTimeout(() => toast.remove(), 160);
    };

    closeBtn.addEventListener('click', dismiss);
    if (duration > 0) {
        setTimeout(dismiss, duration);
    }

    container.appendChild(toast);
}
window.showBrutalToast = showBrutalToast;

// Page Preview Lightbox Singleton
const PageLightbox = {
    pdfDocProxy: null,
    currentPage: 1,
    totalPages: 1,
    isOpen: false,

    init() {
        const modal = document.getElementById('page-lightbox');
        if (!modal) return;

        document.getElementById('lightbox-close')?.addEventListener('click', () => this.close());
        document.getElementById('lightbox-prev')?.addEventListener('click', () => this.prev());
        document.getElementById('lightbox-next')?.addEventListener('click', () => this.next());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });

        window.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });
    },

    async open(pdfDocProxy, pageNum, totalPages) {
        this.pdfDocProxy = pdfDocProxy;
        this.currentPage = Math.max(1, Math.min(pageNum, totalPages));
        this.totalPages = totalPages;
        this.isOpen = true;

        const modal = document.getElementById('page-lightbox');
        if (modal) modal.classList.add('active');

        await this.renderCurrentPage();
    },

    async renderCurrentPage() {
        if (!this.pdfDocProxy) return;

        const titleEl = document.getElementById('lightbox-title');
        const badgeEl = document.getElementById('lightbox-counter');
        const canvas = document.getElementById('lightbox-canvas');

        if (titleEl) titleEl.innerText = `// PAGE INSPECTOR — PAGE ${this.currentPage} OF ${this.totalPages}`;
        if (badgeEl) badgeEl.innerText = `PAGE ${this.currentPage} / ${this.totalPages}`;

        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;

        try {
            const page = await this.pdfDocProxy.getPage(this.currentPage);
            // High resolution render scale
            const viewport = page.getViewport({ scale: 1.25 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport }).promise;
        } catch (err) {
            console.error("Lightbox render error:", err);
            showBrutalToast("Failed to render page preview: " + err.message, "error");
        }
    },

    prev() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderCurrentPage();
        }
    },

    next() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderCurrentPage();
        }
    },

    close() {
        this.isOpen = false;
        const modal = document.getElementById('page-lightbox');
        if (modal) modal.classList.remove('active');
    }
};
window.PageLightbox = PageLightbox;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDragAndDrop();
    PageLightbox.init();
});

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.tool-view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active-view'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            const targetEl = document.getElementById(target);
            if (targetEl) targetEl.classList.add('active-view');
            App.currentTool = target;

            // If on mobile/tablet screens, scroll button into view and scroll to workspace
            if (window.innerWidth <= 920) {
                btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                const workspace = document.querySelector('.workspace');
                if (workspace) {
                    const rect = workspace.getBoundingClientRect();
                    if (rect.top < 0 || rect.top > 300) {
                        workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }
        });
    });
}

function initDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const overlay = document.getElementById('window-drag-overlay');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { 
        e.preventDefault(); 
        dropZone.style.background = "var(--accent)"; 
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.background = "";
    });
    
    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.style.background = "";
        processFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        processFiles(e.target.files);
        fileInput.value = ''; 
    });

    // Full-Window Drag & Drop Overlay
    let dragCounter = 0;
    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        if (overlay && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
            overlay.classList.add('active');
        }
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0 && overlay) {
            dragCounter = 0;
            overlay.classList.remove('active');
        }
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        if (overlay) overlay.classList.remove('active');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    });
}

async function processFiles(fileList) {
    const pdfs = [];
    const images = [];
    
    for (let file of fileList) {
        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            
            if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
                const pdfDoc = await PDFLib.PDFDocument.load(bytes);
                pdfs.push({ name: file.name, bytes: bytes, pageCount: pdfDoc.getPageCount() });
            } else if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp)$/i.test(file.name)) {
                images.push({ name: file.name, type: file.type || 'image/jpeg', bytes: bytes });
            }
        } catch (err) {
            console.error("Error reading file:", file.name, err);
            showBrutalToast(`Failed to parse ${file.name}: ${err.message}`, "error");
        }
    }

    if (pdfs.length === 0 && images.length === 0) {
        showBrutalToast("No valid PDF or Image files detected.", "warning");
        return;
    }

    // Route logic
    if (App.currentTool === 'tool-merge' && pdfs.length > 0) MergeModule.addFiles(pdfs);
    if (App.currentTool === 'tool-rotate' && pdfs.length > 0) RotateModule.loadFile(pdfs[0]); // Only takes 1
    if (App.currentTool === 'tool-img2pdf' && images.length > 0) Img2PdfModule.addFiles(images);
    if (App.currentTool === 'tool-pdf2img' && pdfs.length > 0) Pdf2ImgModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-split' && pdfs.length > 0) SplitModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-watermark' && pdfs.length > 0) WatermarkModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-sign' && pdfs.length > 0) SignModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-compress' && pdfs.length > 0) CompressModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-reorder-pages' && pdfs.length > 0) ReorderModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-stamp' && pdfs.length > 0) StampModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-ghost' && pdfs.length > 0) GhostModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-encrypt' && pdfs.length > 0) EncryptModule.loadFile(pdfs[0]);
}

function downloadBlob(data, fileName) {
    const blob = new Blob([data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Comprehensive zoom prevention for mobile touch gestures and desktop trackpad/keyboard
(function initZoomPrevention() {
    // 1. Prevent iOS gesture zoom (pinch/spread)
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

    // 2. Prevent multi-finger touch zoom (pinch-to-zoom)
    document.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // 3. Prevent double-tap zoom on mobile while allowing standard clicking
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            const tag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
            if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
                e.preventDefault();
            }
        }
        lastTouchEnd = now;
    }, { passive: false });

    // 4. Prevent Ctrl + wheel or pinch zoom on desktop/trackpads
    window.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // 5. Prevent Ctrl + Plus / Ctrl + Minus / Ctrl + 0 keyboard zoom
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
            e.preventDefault();
        }
    });
})();
