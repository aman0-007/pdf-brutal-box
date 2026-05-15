const SplitModule = {
    activePdfBytes: null,
    pdfDoc: null,
    pageCount: 0,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        this.pageCount = fileObj.pageCount;
        this.pdfDoc = await PDFLib.PDFDocument.load(fileObj.bytes);
        
        document.getElementById('split-status').innerHTML = `📄 Loaded: <b>${fileObj.name}</b> (${this.pageCount} Pages)`;
        document.getElementById('split-end').value = this.pageCount;
        document.getElementById('split-start').value = 1;
        document.getElementById('process-split').disabled = false;
    },

    async execute() {
        let start = parseInt(document.getElementById('split-start').value);
        let end = parseInt(document.getElementById('split-end').value);

        // Sanity checks
        if (start < 1) start = 1;
        if (end > this.pageCount) end = this.pageCount;
        if (start > end) return alert("Start page cannot be greater than End page.");

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
    }
};

document.getElementById('process-split').addEventListener('click', () => SplitModule.execute());