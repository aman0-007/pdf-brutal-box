const RotateModule = {
    activePdfBytes: null,
    pdfDoc: null, // pdf-lib instance
    pdfProxy: null, // pdf.js proxy instance
    selectedPages: new Set(),

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        this.pdfDoc = await PDFLib.PDFDocument.load(fileObj.bytes);
        this.selectedPages.clear();
        const resetBtn = document.getElementById('reset-rotate');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        showBrutalToast(`Loaded ${fileObj.name} for rotation/management.`, "info");
        this.renderGrid();
    },

    reset() {
        this.activePdfBytes = null;
        this.pdfDoc = null;
        this.pdfProxy = null;
        this.selectedPages.clear();
        
        const grid = document.getElementById('pages-preview-grid');
        if (grid) grid.innerHTML = "";
        
        document.getElementById('export-modified').disabled = true;
        this.updateButtons();
        
        const resetBtn = document.getElementById('reset-rotate');
        if (resetBtn) resetBtn.style.display = 'none';
        
        showBrutalToast("Page manager reset.", "info");
    },

    async renderGrid() {
        const grid = document.getElementById('pages-preview-grid');
        grid.innerHTML = `
            <div class="batch-progress" id="rotate-progress">
                <div style="display: flex; justify-content: space-between;">
                    <span>INITIALIZING HIGH-SPEED RENDERING ENGINE...</span>
                    <span id="rotate-progress-text">0%</span>
                </div>
                <div class="batch-progress-track">
                    <div class="batch-progress-fill" id="rotate-progress-bar" style="width: 0%;"></div>
                </div>
            </div>
        `;
        
        const loadingTask = pdfjsLib.getDocument({ data: this.activePdfBytes });
        const pdf = await loadingTask.promise;
        this.pdfProxy = pdf;

        const totalPages = pdf.numPages;
        document.getElementById('export-modified').disabled = false;

        const progressEl = document.getElementById('rotate-progress');
        const progressBar = document.getElementById('rotate-progress-bar');
        const progressText = document.getElementById('rotate-progress-text');

        const BATCH_SIZE = 3;
        for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
            const batchLimit = Math.min(i + BATCH_SIZE - 1, totalPages);

            for (let pageNum = i; pageNum <= batchLimit; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 0.35 }); 
                
                const card = document.createElement('div');
                card.className = 'page-card';
                card.style.position = 'relative';
                
                // Check rotation state from PDF-Lib to reflect accurately
                const libPage = this.pdfDoc.getPage(pageNum - 1);
                const rotation = libPage.getRotation().angle;

                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                card.style.transform = `rotate(${rotation}deg)`;

                // Inspect / zoom button
                const inspectBadge = document.createElement('button');
                inspectBadge.className = 'inspect-badge';
                inspectBadge.type = 'button';
                inspectBadge.title = `Inspect Page ${pageNum}`;
                inspectBadge.innerHTML = BrutalIcons.inspect;
                inspectBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    PageLightbox.open(this.pdfProxy, pageNum, totalPages);
                });

                card.appendChild(canvas);
                card.appendChild(inspectBadge);
                
                const label = document.createElement('p');
                label.style.marginTop = "5px";
                label.style.fontWeight = "bold";
                label.innerText = `Page ${pageNum}`;
                card.appendChild(label);

                grid.appendChild(card);

                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

                card.addEventListener('click', () => {
                    card.classList.toggle('selected');
                    if (card.classList.contains('selected')) {
                        this.selectedPages.add(pageNum - 1); // 0-indexed
                    } else {
                        this.selectedPages.delete(pageNum - 1);
                    }
                    this.updateButtons();
                });
            }

            // Update progress bar
            const percent = Math.round((batchLimit / totalPages) * 100);
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressText) progressText.innerText = `${percent}% (${batchLimit}/${totalPages})`;

            // Yield to browser thread for responsive UI
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Remove progress bar after batch completion
        if (progressEl) progressEl.remove();
    },

    updateButtons() {
        const hasSelection = this.selectedPages.size > 0;
        document.getElementById('rotate-selected').disabled = !hasSelection;
        document.getElementById('delete-selected').disabled = !hasSelection;
    },

    rotateSelected() {
        this.selectedPages.forEach(pageIndex => {
            const page = this.pdfDoc.getPage(pageIndex);
            const currentAngle = page.getRotation().angle;
            page.setRotation(PDFLib.degrees(currentAngle + 90));
        });
        showBrutalToast(`Rotated ${this.selectedPages.size} page(s) by 90°.`, "info");
        this.saveAndReload();
    },

    deleteSelected() {
        // Sort descending so deleting indexes doesn't shift remaining targets
        const count = this.selectedPages.size;
        const toDelete = Array.from(this.selectedPages).sort((a, b) => b - a);
        toDelete.forEach(pageIndex => this.pdfDoc.removePage(pageIndex));
        showBrutalToast(`Deleted ${count} page(s).`, "warning");
        this.saveAndReload();
    },

    async saveAndReload() {
        this.activePdfBytes = await this.pdfDoc.save();
        this.selectedPages.clear();
        this.updateButtons();
        this.renderGrid();
    },

    async export() {
        const bytes = await this.pdfDoc.save();
        downloadBlob(bytes, "modified_brutal.pdf");
        showBrutalToast("Exported modified PDF successfully!", "success");
    }
};

window.RotateModule = RotateModule;
document.getElementById('rotate-selected').addEventListener('click', () => RotateModule.rotateSelected());
document.getElementById('delete-selected').addEventListener('click', () => RotateModule.deleteSelected());
document.getElementById('export-modified').addEventListener('click', () => RotateModule.export());
document.getElementById('reset-rotate')?.addEventListener('click', () => RotateModule.reset());