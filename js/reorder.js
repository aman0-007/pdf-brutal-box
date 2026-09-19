const ReorderModule = {
    activePdfBytes: null,
    pdfDoc: null,
    pdfProxy: null,
    draggedElement: null,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        this.pdfDoc = await PDFLib.PDFDocument.load(fileObj.bytes);
        
        const pageCount = this.pdfDoc.getPageCount();
        
        const statusEl = document.getElementById('reorder-status');
        if (statusEl) {
            statusEl.innerHTML = `${BrutalIcons.file} Loaded: <b>${fileObj.name}</b> (${pageCount} Pages)`;
        }
        
        const btn = document.getElementById('process-reorder');
        if (btn) btn.disabled = false;
        
        const resetBtn = document.getElementById('reset-reorder');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        
        showBrutalToast(`Loaded ${fileObj.name} (${pageCount} pages) for reordering.`, "info");
        
        // Render grid in non-blocking batches
        this.renderGrid(pageCount);
    },

    reset() {
        this.activePdfBytes = null;
        this.pdfDoc = null;
        this.pdfProxy = null;
        this.draggedElement = null;

        const grid = document.getElementById('reorder-preview-grid');
        if (grid) grid.innerHTML = "";

        const statusEl = document.getElementById('reorder-status');
        if (statusEl) statusEl.innerHTML = "Load a PDF to reorder its pages.";

        const btn = document.getElementById('process-reorder');
        if (btn) btn.disabled = true;

        const resetBtn = document.getElementById('reset-reorder');
        if (resetBtn) resetBtn.style.display = 'none';

        showBrutalToast("Reorder canvas cleared.", "info");
    },

    async renderGrid(pageCount) {
        const grid = document.getElementById('reorder-preview-grid');
        grid.innerHTML = `
            <div class="batch-progress" id="reorder-progress" style="grid-column: 1 / -1;">
                <div style="display: flex; justify-content: space-between;">
                    <span>PRE-CACHING PAGES FOR DRAG & DROP PIPELINE...</span>
                    <span id="reorder-progress-text">0%</span>
                </div>
                <div class="batch-progress-track">
                    <div class="batch-progress-fill" id="reorder-progress-bar" style="width: 0%;"></div>
                </div>
            </div>
        `;
        
        const loadingTask = pdfjsLib.getDocument({ data: this.activePdfBytes });
        const pdf = await loadingTask.promise;
        this.pdfProxy = pdf;

        const progressEl = document.getElementById('reorder-progress');
        const progressBar = document.getElementById('reorder-progress-bar');
        const progressText = document.getElementById('reorder-progress-text');

        const BATCH_SIZE = 3;
        for (let i = 0; i < pageCount; i += BATCH_SIZE) {
            const batchLimit = Math.min(i + BATCH_SIZE, pageCount);

            for (let pageIdx = i; pageIdx < batchLimit; pageIdx++) {
                const pageNum = pageIdx + 1;
                const page = await pdf.getPage(pageNum); 
                const viewport = page.getViewport({ scale: 0.35 }); 
                
                const card = document.createElement('div');
                card.className = 'page-card';
                card.setAttribute('draggable', 'true');
                card.setAttribute('data-original-index', pageIdx); 
                card.style.position = 'relative';
                
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.style.pointerEvents = 'none'; // Prevents drag bugs on canvas

                // Inspect / zoom button
                const inspectBadge = document.createElement('button');
                inspectBadge.className = 'inspect-badge';
                inspectBadge.type = 'button';
                inspectBadge.title = `Inspect Page ${pageNum}`;
                inspectBadge.innerHTML = BrutalIcons.inspect;
                inspectBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    PageLightbox.open(this.pdfProxy, pageNum, pageCount);
                });

                card.appendChild(canvas);
                card.appendChild(inspectBadge);

                const label = document.createElement('p');
                label.style.marginTop = "5px";
                label.style.fontWeight = "bold";
                label.style.pointerEvents = "none";
                label.innerText = `Page ${pageNum}`;
                card.appendChild(label);

                grid.appendChild(card);

                // Render visual onto canvas
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

                // Attach native drag events to the card
                this.addDragEvents(card);
            }

            // Update batch progress
            const percent = Math.round((batchLimit / pageCount) * 100);
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressText) progressText.innerText = `${percent}% (${batchLimit}/${pageCount})`;

            // Yield control back to browser rendering loop
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (progressEl) progressEl.remove();
    },

    addDragEvents(card) {
        card.addEventListener('dragstart', (e) => {
            this.draggedElement = card;
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            this.draggedElement = null;
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            
            if (this.draggedElement && this.draggedElement !== card) {
                const grid = document.getElementById('reorder-preview-grid');
                const bounding = card.getBoundingClientRect();
                const offset = e.clientX - bounding.left;
                
                // Smart Drop: Drop after the card if dragging to the right side of it, else before.
                if (offset > bounding.width / 2) {
                    grid.insertBefore(this.draggedElement, card.nextSibling);
                } else {
                    grid.insertBefore(this.draggedElement, card);
                }
            }
        });
    },

    async execute() {
        const btn = document.getElementById('process-reorder');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>ASSEMBLING ORDER...</span>`;

        try {
            // Scrape the DOM for the new visual order of the attributes
            const currentCards = document.querySelectorAll('#reorder-preview-grid .page-card');
            const finalOrder = Array.from(currentCards).map(card => parseInt(card.getAttribute('data-original-index')));

            const newPdf = await PDFLib.PDFDocument.create();
            
            // Execute the copy based on our new array sequence
            const copiedPages = await newPdf.copyPages(this.pdfDoc, finalOrder);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const bytes = await newPdf.save();
            downloadBlob(bytes, "reordered_brutal.pdf");
            showBrutalToast(`Reordered ${finalOrder.length} pages and exported PDF!`, "success");
        } catch (err) {
            console.error(err);
            showBrutalToast("Failed to reorder PDF: " + err.message, "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

window.ReorderModule = ReorderModule;
document.getElementById('process-reorder').addEventListener('click', () => ReorderModule.execute());
document.getElementById('reset-reorder')?.addEventListener('click', () => ReorderModule.reset());