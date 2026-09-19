const GhostModule = {
    activePdfBytes: null,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        const statusEl = document.getElementById('ghost-status');
        if (statusEl) {
            statusEl.innerHTML = `${BrutalIcons.file} Loaded Target: <b>${fileObj.name}</b>`;
        }
        document.getElementById('process-ghost').disabled = false;
        const resetBtn = document.getElementById('reset-ghost');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        showBrutalToast(`Loaded ${fileObj.name} for metadata scrubbing.`, "info");
    },

    reset() {
        this.activePdfBytes = null;
        const statusEl = document.getElementById('ghost-status');
        if (statusEl) statusEl.innerHTML = "Load a PDF to strip its hidden footprint.";
        document.getElementById('process-ghost').disabled = true;
        const resetBtn = document.getElementById('reset-ghost');
        if (resetBtn) resetBtn.style.display = 'none';
        showBrutalToast("Ghost mode workspace reset.", "info");
    },

    async execute() {
        if (!this.activePdfBytes) {
            showBrutalToast("Please load a PDF to scrub.", "warning");
            return;
        }

        const btn = document.getElementById('process-ghost');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>SCRUBBING DATA...</span>`;

        setTimeout(async () => {
            try {
                const pdfDoc = await PDFLib.PDFDocument.load(this.activePdfBytes);

                // Nuke all standard metadata fields
                pdfDoc.setTitle('');
                pdfDoc.setAuthor('');
                pdfDoc.setSubject('');
                pdfDoc.setKeywords([]);
                pdfDoc.setProducer('Brutal Box'); // Replace original software tracker
                pdfDoc.setCreator('Brutal Box');  
                
                // Set creation/modification to the Unix Epoch (Jan 1, 1970) to wipe tracking
                const dummyDate = new Date(0); 
                pdfDoc.setCreationDate(dummyDate);
                pdfDoc.setModificationDate(dummyDate);

                // Save with object streams to further compress and rebuild the structure
                const scrubbedBytes = await pdfDoc.save({ useObjectStreams: true });
                
                downloadBlob(scrubbedBytes, "ghosted_brutal.pdf");
                showBrutalToast("All metadata & author footprints purged!", "success");
                
                // Visual feedback of success
                btn.innerHTML = `${BrutalIcons.check} <span>METADATA NUKED</span>`;
                setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);

            } catch (error) {
                console.error(error);
                showBrutalToast("Error scrubbing PDF: " + error.message, "error");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }, 50);
    }
};

window.GhostModule = GhostModule;
document.getElementById('process-ghost').addEventListener('click', () => GhostModule.execute());
document.getElementById('reset-ghost')?.addEventListener('click', () => GhostModule.reset());