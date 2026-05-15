const CompressModule = {
    activePdfBytes: null,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        const originalSize = (this.activePdfBytes.byteLength / 1024 / 1024).toFixed(2);
        document.getElementById('compress-status').innerHTML = `📄 Loaded: <b>${fileObj.name}</b> (${originalSize} MB)`;
        document.getElementById('process-compress').disabled = false;
    },

    async execute() {
        const pdfDoc = await PDFLib.PDFDocument.load(this.activePdfBytes);
        
        // Save with useObjectStreams to compress structure and metadata natively
        const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
        
        const newSize = (compressedBytes.byteLength / 1024 / 1024).toFixed(2);
        alert(`Compression Complete!\nOriginal: ${(this.activePdfBytes.byteLength/1024/1024).toFixed(2)} MB\nNew: ${newSize} MB`);
        
        downloadBlob(compressedBytes, "compressed_brutal.pdf");
    }
};

document.getElementById('process-compress').addEventListener('click', () => CompressModule.execute());