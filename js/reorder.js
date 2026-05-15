const ReorderModule = {
    activePdfBytes: null,
    pdfDoc: null,
    draggedElement: null,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        this.pdfDoc = await PDFLib.PDFDocument.load(fileObj.bytes);
        
        const pageCount = this.pdfDoc.getPageCount();
        
        document.getElementById('reorder-status').innerHTML = `📄 Loaded: <b>${fileObj.name}</b> (${pageCount} Pages)`;
        document.getElementById('process-reorder').disabled = false;
        
        // Only call renderGrid once!
        this.renderGrid(pageCount);
    },

    async renderGrid(pageCount) {
        const grid = document.getElementById('reorder-preview-grid');
        grid.innerHTML = "<p style='grid-column: 1 / -1; font-weight: bold;'>Rendering Previews once...</p>";
        
        const loadingTask = pdfjsLib.getDocument({ data: this.activePdfBytes });
        const pdf = await loadingTask.promise;
        grid.innerHTML = ""; 

        for (let i = 0; i < pageCount; i++) {
            const page = await pdf.getPage(i + 1); 
            const viewport = page.getViewport({ scale: 0.3 }); 
            
            const card = document.createElement('div');
            card.className = 'page-card';
            card.setAttribute('draggable', 'true');
            // Store the original index so we know what this page actually is
            card.setAttribute('data-original-index', i); 
            
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.pointerEvents = 'none'; // Prevents drag bugs on canvas

            card.appendChild(canvas);
            card.innerHTML += `<p style="margin-top:5px; font-weight:bold; pointer-events:none;">Page ${i + 1}</p>`;
            grid.appendChild(card);

            // Render visual onto canvas
            await page.render({ canvasContext: card.querySelector('canvas').getContext('2d'), viewport }).promise;

            // Attach native drag events to the card
            this.addDragEvents(card);
        }
    },

    addDragEvents(card) {
        card.addEventListener('dragstart', (e) => {
            this.draggedElement = card;
            // setTimeout allows the visual ghosting to appear before hiding the origin
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            this.draggedElement = null;
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            
            if (this.draggedElement && this.draggedElement !== card) {
                const grid = document.getElementById('reorder-preview-grid');
                const bounding = card.getBoundingClientRect();
                const offset = e.clientX - bounding.left;
                
                // Smart Drop: Drop after the card if dragging to the right side of it, else before.
                if (offset > bounding.width / 2) {
                    grid.insertBefore(this.draggedElement, card.nextSibling);
                } else {
                    grid.insertBefore(this.draggedElement, card);
                }
            }
        });
    },

    async execute() {
        // Scrape the DOM for the new visual order of the attributes
        const currentCards = document.querySelectorAll('#reorder-preview-grid .page-card');
        const finalOrder = Array.from(currentCards).map(card => parseInt(card.getAttribute('data-original-index')));

        const newPdf = await PDFLib.PDFDocument.create();
        
        // Execute the copy based on our new array sequence
        const copiedPages = await newPdf.copyPages(this.pdfDoc, finalOrder);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const bytes = await newPdf.save();
        downloadBlob(bytes, "reordered_brutal.pdf");
    }
};

document.getElementById('process-reorder').addEventListener('click', () => ReorderModule.execute());