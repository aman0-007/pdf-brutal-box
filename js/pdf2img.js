const Pdf2ImgModule = {
    activePdfBytes: null,
    pdfDocProxy: null, // PDF.js loaded document
    keptPages: [], // Array of page numbers (1-indexed) to extract

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        
        // Load the document via PDF.js for rendering
        const loadingTask = pdfjsLib.getDocument({ data: this.activePdfBytes });
        this.pdfDocProxy = await loadingTask.promise;
        
        const pageCount = this.pdfDocProxy.numPages;
        
        // Initialize all pages to be kept by default
        this.keptPages = Array.from({length: pageCount}, (_, i) => i + 1);
        
        const statusEl = document.getElementById('pdf2img-status');
        if (statusEl) {
            statusEl.innerHTML = `${BrutalIcons.file} Loaded: <b>${fileObj.name}</b> (${pageCount} Pages)`;
        }
        
        const btn = document.getElementById('process-pdf2img');
        if (btn) btn.disabled = false;

        const resetBtn = document.getElementById('reset-pdf2img');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        
        showBrutalToast(`Loaded ${fileObj.name} for extraction.`, "info");
        this.renderGrid();
    },

    reset() {
        this.activePdfBytes = null;
        this.pdfDocProxy = null;
        this.keptPages = [];

        const grid = document.getElementById('pdf2img-preview-grid');
        if (grid) grid.innerHTML = "";

        const statusEl = document.getElementById('pdf2img-status');
        if (statusEl) statusEl.innerHTML = "Load a PDF to extract pages.";

        const btn = document.getElementById('process-pdf2img');
        if (btn) btn.disabled = true;

        const resetBtn = document.getElementById('reset-pdf2img');
        if (resetBtn) resetBtn.style.display = 'none';

        showBrutalToast("Image shredder reset.", "info");
    },

    async renderGrid() {
        const grid = document.getElementById('pdf2img-preview-grid');
        grid.innerHTML = `
            <div class="batch-progress" id="pdf2img-progress" style="grid-column: 1 / -1;">
                <div style="display: flex; justify-content: space-between;">
                    <span>GENERATING THUMBNAILS IN BATCHES...</span>
                    <span id="pdf2img-progress-text">0%</span>
                </div>
                <div class="batch-progress-track">
                    <div class="batch-progress-fill" id="pdf2img-progress-bar" style="width: 0%;"></div>
                </div>
            </div>
        `;
        
        const total = this.keptPages.length;
        const progressEl = document.getElementById('pdf2img-progress');
        const progressBar = document.getElementById('pdf2img-progress-bar');
        const progressText = document.getElementById('pdf2img-progress-text');

        const BATCH_SIZE = 3;
        for (let i = 0; i < total; i += BATCH_SIZE) {
            const batch = this.keptPages.slice(i, i + BATCH_SIZE);

            for (let pageNum of batch) {
                const page = await this.pdfDocProxy.getPage(pageNum); 
                const viewport = page.getViewport({ scale: 0.35 }); 
                
                const card = document.createElement('div');
                card.className = 'page-card';
                card.id = `pdf2img-card-${pageNum}`;
                card.style.position = 'relative';
                
                // The Brutal Delete Button
                const deleteBtn = document.createElement('div');
                deleteBtn.className = 'delete-badge';
                deleteBtn.setAttribute('title', 'Remove page');
                deleteBtn.setAttribute('aria-label', `Remove page ${pageNum}`);
                deleteBtn.innerHTML = BrutalIcons.close;
                deleteBtn.onclick = () => this.removePage(pageNum);

                // Inspect / zoom button
                const inspectBadge = document.createElement('button');
                inspectBadge.className = 'inspect-badge';
                inspectBadge.type = 'button';
                inspectBadge.title = `Inspect Page ${pageNum}`;
                inspectBadge.innerHTML = BrutalIcons.inspect;
                inspectBadge.style.bottom = '36px'; // Position above page label
                inspectBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    PageLightbox.open(this.pdfDocProxy, pageNum, this.pdfDocProxy.numPages);
                });

                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const label = document.createElement('p');
                label.style.marginTop = '5px';
                label.style.fontWeight = 'bold';
                label.innerText = `Page ${pageNum}`;

                card.appendChild(deleteBtn);
                card.appendChild(inspectBadge);
                card.appendChild(canvas);
                card.appendChild(label);
                grid.appendChild(card);

                // Render visual onto canvas
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;
            }

            const currentLoaded = Math.min(i + BATCH_SIZE, total);
            const percent = Math.round((currentLoaded / total) * 100);
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressText) progressText.innerText = `${percent}% (${currentLoaded}/${total})`;

            await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (progressEl) progressEl.remove();
    },

    removePage(pageNum) {
        // Remove from our internal array
        this.keptPages = this.keptPages.filter(p => p !== pageNum);
        
        // Remove from DOM visually with a brutal snap
        const card = document.getElementById(`pdf2img-card-${pageNum}`);
        if (card) card.remove();

        showBrutalToast(`Removed Page ${pageNum} from extraction list.`, "info");

        // Update UI state
        if (this.keptPages.length === 0) {
            document.getElementById('process-pdf2img').disabled = true;
            document.getElementById('pdf2img-preview-grid').innerHTML = "<p style='font-weight: bold; padding: 12px;'>All pages removed. Upload a new PDF.</p>";
        }
    },

    async execute() {
        const btn = document.getElementById('process-pdf2img');
        const format = document.getElementById('pdf2img-format').value; // 'image/png' or 'image/jpeg'
        const scaleMultiplier = parseFloat(document.getElementById('pdf2img-scale').value); // 1.5 or 3.0
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>SHREDDING AND ZIPPING...</span>`;

        setTimeout(async () => {
            try {
                const zip = new JSZip();
                const folder = zip.folder("Extracted_Pages_Brutal");

                for (let pageNum of this.keptPages) {
                    const page = await this.pdfDocProxy.getPage(pageNum);
                    
                    // Render HIGH RES for the actual download
                    const viewport = page.getViewport({ scale: scaleMultiplier });
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({ canvasContext: ctx, viewport }).promise;

                    // Convert to base64
                    const dataUrl = canvas.toDataURL(format, 0.9);
                    const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

                    // Add to ZIP
                    folder.file(`Page_${pageNum}.${ext}`, base64Data, {base64: true});
                }

                // Generate ZIP file and trigger download
                const zipContent = await zip.generateAsync({type: "blob"});
                
                const url = window.URL.createObjectURL(zipContent);
                const a = document.createElement('a');
                a.href = url;
                a.download = "Shredded_Brutal_Output.zip";
                a.click();
                window.URL.revokeObjectURL(url);
                showBrutalToast(`Downloaded ${this.keptPages.length} images in ZIP archive!`, "success");

            } catch (error) {
                console.error("Error extracting pages:", error);
                showBrutalToast("Error extracting pages: " + error.message, "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }, 50);
    }
};

window.Pdf2ImgModule = Pdf2ImgModule;
document.getElementById('process-pdf2img').addEventListener('click', () => Pdf2ImgModule.execute());
document.getElementById('reset-pdf2img')?.addEventListener('click', () => Pdf2ImgModule.reset());