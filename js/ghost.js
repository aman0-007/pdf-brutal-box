const GhostModule = {
    activePdfBytes: null,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        document.getElementById('ghost-status').innerHTML = `📄 Loaded Target: <b>${fileObj.name}</b>`;
        document.getElementById('process-ghost').disabled = false;
    },

    async execute() {
        const btn = document.getElementById('process-ghost');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = "☢️ SCRUBBING DATA...";

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
                
                // Visual feedback of success
                btn.innerHTML = "✔️ METADATA NUKED";
                setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);

            } catch (error) {
                alert("Error scrubbing PDF: " + error.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }, 50);
    }
};

document.getElementById('process-ghost').addEventListener('click', () => GhostModule.execute());