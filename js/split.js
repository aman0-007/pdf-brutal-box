const SplitModule = {
    activePdfBytes: null,
    pdfDoc: null,
    pageCount: 0,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        this.pageCount = fileObj.pageCount;
        this.pdfDoc = await PDFLib.PDFDocument.load(fileObj.bytes);
        
        const statusEl = document.getElementById('split-status');
        if (statusEl) {
            statusEl.innerHTML = `${BrutalIcons.file} Loaded: <b>${fileObj.name}</b> (${this.pageCount} Pages)`;
        }
        document.getElementById('split-end').value = this.pageCount;
        document.getElementById('split-start').value = 1;
        document.getElementById('process-split').disabled = false;
        
        const resetBtn = document.getElementById('reset-split');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        showBrutalToast(`Loaded ${fileObj.name} (${this.pageCount} pages).`, "info");
    },

    reset() {
        this.activePdfBytes = null;
        this.pdfDoc = null;
        this.pageCount = 0;
        const statusEl = document.getElementById('split-status');
        if (statusEl) statusEl.innerHTML = "Load a PDF to extract pages.";
        document.getElementById('split-start').value = "";
        document.getElementById('split-end').value = "";
        document.getElementById('process-split').disabled = true;
        const resetBtn = document.getElementById('reset-split');
        if (resetBtn) resetBtn.style.display = 'none';
        showBrutalToast("Page extractor reset.", "info");
    },

    async execute() {
        let start = parseInt(document.getElementById('split-start').value);
        let end = parseInt(document.getElementById('split-end').value);

        if (isNaN(start) || isNaN(end)) {
            showBrutalToast("Please enter valid start and end page numbers.", "warning");
            return;
        }

        // Sanity checks
        if (start < 1) start = 1;
        if (end > this.pageCount) end = this.pageCount;
        if (start > end) {
            showBrutalToast("Start page cannot be greater than End page.", "error");
            return;
        }

        const btn = document.getElementById('process-split');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>EXTRACTING...</span>`;

        try {
            const newPdf = await PDFLib.PDFDocument.create();
            
            // pdf-lib uses 0-based index. Create an array of requested indices.
            const indices = [];
            for (let i = start - 1; i <= end - 1; i++) {
                indices.push(i);
            }

            const copiedPages = await newPdf.copyPages(this.pdfDoc, indices);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const bytes = await newPdf.save();
            downloadBlob(bytes, `extracted_pages_${start}-${end}.pdf`);
            showBrutalToast(`Extracted pages ${start} through ${end} successfully!`, "success");
        } catch (err) {
            console.error(err);
            showBrutalToast("Failed to extract pages: " + err.message, "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

window.SplitModule = SplitModule;
document.getElementById('process-split').addEventListener('click', () => SplitModule.execute());
document.getElementById('reset-split')?.addEventListener('click', () => SplitModule.reset());