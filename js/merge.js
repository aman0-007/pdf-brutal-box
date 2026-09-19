const MergeModule = {
    files: [],
    addFiles(newFiles) {
        this.files.push(...newFiles);
        this.renderUI();
    },
    moveUp(index) {
        if (index > 0) {
            [this.files[index - 1], this.files[index]] = [this.files[index], this.files[index - 1]];
            this.renderUI();
        }
    },
    moveDown(index) {
        if (index < this.files.length - 1) {
            [this.files[index + 1], this.files[index]] = [this.files[index], this.files[index + 1]];
            this.renderUI();
        }
    },
    removeFile(index) {
        this.files.splice(index, 1);
        this.renderUI();
    },
    reset() {
        this.files = [];
        this.renderUI();
        showBrutalToast("Merge list cleared.", "info");
    },
    renderUI() {
        const manifest = document.getElementById('merge-list');
        const btn = document.getElementById('process-merge');
        const resetBtn = document.getElementById('reset-merge');
        if (this.files.length === 0) {
            manifest.innerHTML = "No files loaded yet.";
            btn.disabled = true;
            if (resetBtn) resetBtn.style.display = 'none';
            return;
        }
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        btn.disabled = this.files.length < 2;
        manifest.innerHTML = this.files.map((f, i) => `
            <div class="manifest-item" style="align-items: center;">
                <span class="manifest-label">${BrutalIcons.file} ${f.name} (${f.pageCount} pgs)</span>
                <div class="list-controls">
                    <button class="list-btn" onclick="MergeModule.moveUp(${i})" title="Move up" aria-label="Move up">${BrutalIcons.up}</button>
                    <button class="list-btn" onclick="MergeModule.moveDown(${i})" title="Move down" aria-label="Move down">${BrutalIcons.down}</button>
                    <button class="list-btn del" onclick="MergeModule.removeFile(${i})" title="Remove file" aria-label="Remove file">${BrutalIcons.close}</button>
                </div>
            </div>
        `).join('');
    },
    async execute() {
        const btn = document.getElementById('process-merge');
        
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>PROCESSING...</span>`;
        
        setTimeout(async () => {
            try {
                const mergedPdf = await PDFLib.PDFDocument.create();
                for (let fileObj of this.files) {
                    const srcPdf = await PDFLib.PDFDocument.load(fileObj.bytes);
                    const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }
                const mergedBytes = await mergedPdf.save();
                downloadBlob(mergedBytes, "merged_brutal.pdf");
                showBrutalToast(`Merged ${this.files.length} PDFs successfully!`, "success");
                
                this.files = [];
                this.renderUI();
            } catch (error) {
                console.error(error);
                showBrutalToast("Error merging files: " + error.message, "error");
            } finally {
                btn.innerHTML = originalText;
            }
        }, 50);
    }
};
window.MergeModule = MergeModule;
document.getElementById('process-merge').addEventListener('click', () => MergeModule.execute());
document.getElementById('reset-merge')?.addEventListener('click', () => MergeModule.reset());