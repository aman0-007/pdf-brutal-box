const Pdf2ImgModule = {
    activePdfBytes: null,
    pdfDocProxy: null, // PDF.js loaded document
    keptPages: [], // Array of page numbers (1-indexed) to extract

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        
        // Load the document via PDF.js for rendering
        const loadingTask = pdfjsLib.getDocument({ data: this.activePdfBytes });
        this.pdfDocProxy = await loadingTask.promise;
        
        const pageCount = this.pdfDocProxy.numPages;
        
        // Initialize all pages to be kept by default
        this.keptPages = Array.from({length: pageCount}, (_, i) => i + 1);
        
        document.getElementById('pdf2img-status').innerHTML = `📄 Loaded: <b>${fileObj.name}</b> (${pageCount} Pages)`;
        document.getElementById('process-pdf2img').disabled = false;
        
        this.renderGrid();
    },

    async renderGrid() {
        const grid = document.getElementById('pdf2img-preview-grid');
        grid.innerHTML = "<p style='grid-column: 1 / -1; font-weight: bold;'>Rendering Thumbnails...</p>";
        
        grid.innerHTML = ""; 

        for (let pageNum of this.keptPages) {
            const page = await this.pdfDocProxy.getPage(pageNum); 
            // Use low scale for quick UI thumbnails
            const viewport = page.getViewport({ scale: 0.3 }); 
            
            const card = document.createElement('div');
            card.className = 'page-card';
            card.id = `pdf2img-card-${pageNum}`;
            
            // The Brutal Delete Button
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-badge';
            deleteBtn.innerHTML = '✖';
            
            // Because we use appendChild below, this onclick will survive!
            deleteBtn.onclick = () => this.removePage(pageNum);

            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Safely create the label instead of using innerHTML
            const label = document.createElement('p');
            label.style.marginTop = '5px';
            label.style.fontWeight = 'bold';
            label.innerText = `Page ${pageNum}`;

            // Append everything safely
            card.appendChild(deleteBtn);
            card.appendChild(canvas);
            card.appendChild(label);
            grid.appendChild(card);

            // Render visual onto canvas
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
        }
    },

    removePage(pageNum) {
        // Remove from our internal array
        this.keptPages = this.keptPages.filter(p => p !== pageNum);
        
        // Remove from DOM visually with a brutal snap
        const card = document.getElementById(`pdf2img-card-${pageNum}`);
        if (card) card.remove();

        // Update UI state
        if (this.keptPages.length === 0) {
            document.getElementById('process-pdf2img').disabled = true;
            document.getElementById('pdf2img-preview-grid').innerHTML = "<p>All pages removed. Upload a new PDF.</p>";
        }
    },

    async execute() {
        const btn = document.getElementById('process-pdf2img');
        const format = document.getElementById('pdf2img-format').value; // 'image/png' or 'image/jpeg'
        const scaleMultiplier = parseFloat(document.getElementById('pdf2img-scale').value); // 1.5 or 3.0
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ SHREDDING AND ZIPPING...";

        // Use setTimeout to let UI update before heavy CPU tasks block the thread
        setTimeout(async () => {
            try {
                const zip = new JSZip();
                const folder = zip.folder("Extracted_Pages_Brutal");

                for (let pageNum of this.keptPages) {
                    const page = await this.pdfDocProxy.getPage(pageNum);
                    
                    // Render HIGH RES for the actual download
                    const viewport = page.getViewport({ scale: scaleMultiplier });
                    
                    // We need a temporary off-screen canvas to do the high-res render
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({ canvasContext: ctx, viewport }).promise;

                    // Convert to base64, slice off the metadata header so JSZip can read it
                    const dataUrl = canvas.toDataURL(format, 0.9); // 0.9 quality for JPEG, ignored for PNG
                    const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

                    // Add to ZIP
                    folder.file(`Page_${pageNum}.${ext}`, base64Data, {base64: true});
                }

                // Generate ZIP file and trigger download
                const zipContent = await zip.generateAsync({type: "blob"});
                
                // Use global download helper from core.js
                const url = window.URL.createObjectURL(zipContent);
                const a = document.createElement('a');
                a.href = url;
                a.download = "Shredded_Brutal_Output.zip";
                a.click();
                window.URL.revokeObjectURL(url);

            } catch (error) {
                alert("Error extracting pages: " + error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }, 50);
    }
};

document.getElementById('process-pdf2img').addEventListener('click', () => Pdf2ImgModule.execute());