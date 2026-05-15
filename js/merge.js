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
    renderUI() {
        const manifest = document.getElementById('merge-list');
        const btn = document.getElementById('process-merge');
        if (this.files.length === 0) {
            manifest.innerHTML = "No files loaded yet.";
            btn.disabled = true;
            return;
        }
        btn.disabled = this.files.length < 2;
        manifest.innerHTML = this.files.map((f, i) => `
            <div class="manifest-item" style="align-items: center;">
                <span>📄 ${f.name} (${f.pageCount} pgs)</span>
                <div class="list-controls">
                    <button class="list-btn" onclick="MergeModule.moveUp(${i})">↑</button>
                    <button class="list-btn" onclick="MergeModule.moveDown(${i})">↓</button>
                    <button class="list-btn del" onclick="MergeModule.removeFile(${i})">✖</button>
                </div>
            </div>
        `).join('');
    },
    async execute() {
        const btn = document.getElementById('process-merge');
        
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ PROCESSING...";
        
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
                
                this.files = [];
                this.renderUI();
            } catch (error) {
                alert("Error merging files: " + error.message);
            } finally {
                // 2. Restore UI
                btn.innerHTML = originalText;
            }
        }, 50);
    }
};
document.getElementById('process-merge').addEventListener('click', () => MergeModule.execute());