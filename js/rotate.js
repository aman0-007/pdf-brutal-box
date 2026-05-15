const RotateModule = {
    activePdfBytes: null,
    pdfDoc: null, // pdf-lib instance
    selectedPages: new Set(),

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        this.pdfDoc = await PDFLib.PDFDocument.load(fileObj.bytes);
        this.selectedPages.clear();
        this.renderGrid();
    },

    async renderGrid() {
        const grid = document.getElementById('pages-preview-grid');
        grid.innerHTML = "Loading previews...";
        
        const loadingTask = pdfjsLib.getDocument({ data: this.activePdfBytes });
        const pdf = await loadingTask.promise;
        grid.innerHTML = ""; 

        document.getElementById('export-modified').disabled = false;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 0.3 }); 
            
            const card = document.createElement('div');
            card.className = 'page-card';
            
            // Check rotation state from PDF-Lib to reflect accurately
            const libPage = this.pdfDoc.getPage(pageNum - 1);
            const rotation = libPage.getRotation().angle;

            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            card.style.transform = `rotate(${rotation}deg)`; // Apply initial visual rotation

            card.appendChild(canvas);
            card.innerHTML += `<p style="margin-top:5px; font-weight:bold;">Page ${pageNum}</p>`;
            grid.appendChild(card);

            await page.render({ canvasContext: card.querySelector('canvas').getContext('2d'), viewport }).promise;

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
        this.saveAndReload();
    },

    deleteSelected() {
        // Sort descending so deleting indexes doesn't shift remaining targets
        const toDelete = Array.from(this.selectedPages).sort((a, b) => b - a);
        toDelete.forEach(pageIndex => this.pdfDoc.removePage(pageIndex));
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
    }
};

document.getElementById('rotate-selected').addEventListener('click', () => RotateModule.rotateSelected());
document.getElementById('delete-selected').addEventListener('click', () => RotateModule.deleteSelected());
document.getElementById('export-modified').addEventListener('click', () => RotateModule.export());