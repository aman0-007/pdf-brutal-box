const Img2PdfModule = {
    images: [],
    addFiles(newImages) {
        this.images.push(...newImages);
        this.renderUI();
    },
    moveUp(index) {
        if (index > 0) {
            [this.images[index - 1], this.images[index]] = [this.images[index], this.images[index - 1]];
            this.renderUI();
        }
    },
    moveDown(index) {
        if (index < this.images.length - 1) {
            [this.images[index + 1], this.images[index]] = [this.images[index], this.images[index + 1]];
            this.renderUI();
        }
    },
    removeFile(index) {
        this.images.splice(index, 1);
        this.renderUI();
    },
    reset() {
        this.images = [];
        this.renderUI();
        showBrutalToast("Image list cleared.", "info");
    },
    renderUI() {
        const manifest = document.getElementById('img-list');
        const btn = document.getElementById('process-img2pdf');
        const resetBtn = document.getElementById('reset-img2pdf');
        if (this.images.length === 0) {
            manifest.innerHTML = "No images loaded yet.";
            btn.disabled = true;
            if (resetBtn) resetBtn.style.display = 'none';
            return;
        }
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        btn.disabled = false;
        manifest.innerHTML = this.images.map((img, i) => `
            <div class="manifest-item" style="align-items: center;">
                <span class="manifest-label">${BrutalIcons.image} ${img.name}</span>
                <div class="list-controls">
                    <button class="list-btn" onclick="Img2PdfModule.moveUp(${i})" title="Move up" aria-label="Move up">${BrutalIcons.up}</button>
                    <button class="list-btn" onclick="Img2PdfModule.moveDown(${i})" title="Move down" aria-label="Move down">${BrutalIcons.down}</button>
                    <button class="list-btn del" onclick="Img2PdfModule.removeFile(${i})" title="Remove image" aria-label="Remove image">${BrutalIcons.close}</button>
                </div>
            </div>
        `).join('');
    },
    async execute() {
        const btn = document.getElementById('process-img2pdf');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>CONVERTING IMAGES...</span>`;

        try {
            const newPdf = await PDFLib.PDFDocument.create();
            for (let imgObj of this.images) {
                let pdfImage;
                if (imgObj.type === 'image/jpeg' || imgObj.type === 'image/jpg') {
                    pdfImage = await newPdf.embedJpg(imgObj.bytes);
                } else if (imgObj.type === 'image/png') {
                    pdfImage = await newPdf.embedPng(imgObj.bytes);
                }
                if (pdfImage) {
                    const page = newPdf.addPage([pdfImage.width, pdfImage.height]);
                    page.drawImage(pdfImage, { x: 0, y: 0, width: pdfImage.width, height: pdfImage.height });
                }
            }
            const pdfBytes = await newPdf.save();
            downloadBlob(pdfBytes, "images_brutal.pdf");
            showBrutalToast(`Converted ${this.images.length} images into PDF!`, "success");
            this.images = [];
            this.renderUI();
        } catch (err) {
            console.error(err);
            showBrutalToast("Failed to convert images: " + err.message, "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};
window.Img2PdfModule = Img2PdfModule;
document.getElementById('process-img2pdf').addEventListener('click', () => Img2PdfModule.execute());
document.getElementById('reset-img2pdf')?.addEventListener('click', () => Img2PdfModule.reset());