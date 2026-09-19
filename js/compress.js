const CompressModule = {
    activePdfBytes: null,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        const originalSize = (this.activePdfBytes.byteLength / 1024 / 1024).toFixed(2);
        const statusEl = document.getElementById('compress-status');
        if (statusEl) {
            statusEl.innerHTML = `${BrutalIcons.file} Loaded: <b>${fileObj.name}</b> (${originalSize} MB)`;
        }
        document.getElementById('process-compress').disabled = false;
        const resetBtn = document.getElementById('reset-compress');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        showBrutalToast(`Loaded ${fileObj.name} (${originalSize} MB).`, "info");
    },

    reset() {
        this.activePdfBytes = null;
        const statusEl = document.getElementById('compress-status');
        if (statusEl) statusEl.innerHTML = "Load a PDF to compress.";
        document.getElementById('process-compress').disabled = true;
        const resetBtn = document.getElementById('reset-compress');
        if (resetBtn) resetBtn.style.display = 'none';
        showBrutalToast("Compressor cleared.", "info");
    },

    async execute() {
        if (!this.activePdfBytes) {
            showBrutalToast("Please load a PDF to compress.", "warning");
            return;
        }

        const btn = document.getElementById('process-compress');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>OPTIMIZING STREAMS...</span>`;

        setTimeout(async () => {
            try {
                const pdfDoc = await PDFLib.PDFDocument.load(this.activePdfBytes);
                
                // Save with useObjectStreams to compress structure and metadata natively
                const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
                
                const origMB = (this.activePdfBytes.byteLength / 1024 / 1024).toFixed(2);
                const newSize = (compressedBytes.byteLength / 1024 / 1024).toFixed(2);
                downloadBlob(compressedBytes, "compressed_brutal.pdf");
                
                showBrutalToast(`Compressed PDF from ${origMB} MB to ${newSize} MB!`, "success");
                btn.innerHTML = `${BrutalIcons.check} <span>OPTIMIZED (${newSize} MB)</span>`;
                setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2500);
            } catch (err) {
                console.error(err);
                showBrutalToast("Compression error: " + err.message, "error");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }, 50);
    }
};

window.CompressModule = CompressModule;
document.getElementById('process-compress').addEventListener('click', () => CompressModule.execute());
document.getElementById('reset-compress')?.addEventListener('click', () => CompressModule.reset());