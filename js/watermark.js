const WatermarkModule = {
    activePdfBytes: null,

    init() {
        // Toggle UI inputs based on selection
        document.getElementById('watermark-type').addEventListener('change', (e) => {
            const isText = e.target.value === 'text';
            document.getElementById('watermark-text').style.display = isText ? 'block' : 'none';
            document.getElementById('watermark-img-upload').style.display = isText ? 'none' : 'block';
        });

        document.getElementById('process-watermark').addEventListener('click', () => this.execute());
    },

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        const statusEl = document.getElementById('watermark-status');
        if (statusEl) {
            statusEl.innerHTML = `${BrutalIcons.file} Ready to stamp: <b>${fileObj.name}</b>`;
        }
        document.getElementById('process-watermark').disabled = false;
        const resetBtn = document.getElementById('reset-watermark');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        showBrutalToast(`Loaded ${fileObj.name} for watermarking.`, "info");
    },

    reset() {
        this.activePdfBytes = null;
        const statusEl = document.getElementById('watermark-status');
        if (statusEl) statusEl.innerHTML = "Load a PDF to stamp.";
        document.getElementById('process-watermark').disabled = true;
        const resetBtn = document.getElementById('reset-watermark');
        if (resetBtn) resetBtn.style.display = 'none';
        showBrutalToast("Watermark workspace reset.", "info");
    },

    async execute() {
        if (!this.activePdfBytes) {
            showBrutalToast("Please load a PDF file first.", "warning");
            return;
        }

        const btn = document.getElementById('process-watermark');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>APPLYING WATERMARK...</span>`;

        try {
            const type = document.getElementById('watermark-type').value;
            const pdfDoc = await PDFLib.PDFDocument.load(this.activePdfBytes);
            const pages = pdfDoc.getPages();

            if (type === 'text') {
                // TEXT WATERMARK LOGIC
                const text = document.getElementById('watermark-text').value || "CONFIDENTIAL";
                const { rgb, degrees } = PDFLib;
                pages.forEach(page => {
                    const { width, height } = page.getSize();
                    page.drawText(text, {
                        x: width / 4, y: height / 4, size: 60,
                        color: rgb(0.95, 0.1, 0.1), opacity: 0.4, rotate: degrees(45),
                    });
                });
            } else {
                // IMAGE WATERMARK LOGIC
                const fileInput = document.getElementById('watermark-img-upload');
                if (!fileInput.files.length) {
                    showBrutalToast("Please upload a watermark image first.", "warning");
                    return;
                }
                
                const file = fileInput.files[0];
                const imgBytes = await file.arrayBuffer();
                let pdfImage;

                if (file.type === 'image/png') pdfImage = await pdfDoc.embedPng(imgBytes);
                else if (file.type === 'image/jpeg' || file.type === 'image/jpg') pdfImage = await pdfDoc.embedJpg(imgBytes);
                else {
                    showBrutalToast("Only PNG and JPG are supported for image watermarks.", "error");
                    return;
                }

                pages.forEach(page => {
                    const { width, height } = page.getSize();
                    const scaledDims = pdfImage.scaleToFit(width * 0.8, height * 0.8);
                    page.drawImage(pdfImage, {
                        x: (width / 2) - (scaledDims.width / 2),
                        y: (height / 2) - (scaledDims.height / 2),
                        width: scaledDims.width,
                        height: scaledDims.height,
                        opacity: 0.3
                    });
                });
            }

            const bytes = await pdfDoc.save();
            downloadBlob(bytes, "watermarked_brutal.pdf");
            showBrutalToast(`Applied watermark across ${pages.length} pages!`, "success");
        } catch (err) {
            console.error(err);
            showBrutalToast("Failed to apply watermark: " + err.message, "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

window.WatermarkModule = WatermarkModule;
document.addEventListener('DOMContentLoaded', () => {
    WatermarkModule.init();
    document.getElementById('reset-watermark')?.addEventListener('click', () => WatermarkModule.reset());
});