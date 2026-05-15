const SignModule = {
    activePdfBytes: null,
    canvas: document.getElementById('signature-pad'),
    ctx: null,
    isDrawing: false,

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#000000';

        this.setupDrawEvents();

        // UI Toggles
        document.getElementById('sign-mode').addEventListener('change', (e) => {
            const isDraw = e.target.value === 'draw';
            document.getElementById('sign-pad-wrapper').style.display = isDraw ? 'block' : 'none';
            document.getElementById('sign-img-upload').style.display = isDraw ? 'none' : 'block';
        });

        document.getElementById('clear-signature').addEventListener('click', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        });

        document.getElementById('process-sign').addEventListener('click', () => this.execute());
    },

    // Handles both Mouse and Mobile Touch events
    setupDrawEvents() {
        // Mouse Events
        this.canvas.addEventListener('mousedown', (e) => this.startDraw(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', () => this.endDraw());
        this.canvas.addEventListener('mouseout', () => this.endDraw());

        // Touch Events (Mobile)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Stop screen from scrolling
            const touch = e.touches[0];
            this.startDraw(touch.clientX, touch.clientY);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.draw(touch.clientX, touch.clientY);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endDraw();
        });
    },

    getMousePos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            // Scale logic in case canvas is resized by CSS
            x: (clientX - rect.left) * (this.canvas.width / rect.width),
            y: (clientY - rect.top) * (this.canvas.height / rect.height)
        };
    },

    startDraw(clientX, clientY) {
        this.isDrawing = true;
        const pos = this.getMousePos(clientX, clientY);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    },

    draw(clientX, clientY) {
        if (!this.isDrawing) return;
        const pos = this.getMousePos(clientX, clientY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    },

    endDraw() {
        this.isDrawing = false;
        this.ctx.beginPath();
    },

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        document.getElementById('sign-status').innerHTML = `📄 Document ready: <b>${fileObj.name}</b>`;
        document.getElementById('process-sign').disabled = false;
    },

    async execute() {
        const pdfDoc = await PDFLib.PDFDocument.load(this.activePdfBytes);
        const mode = document.getElementById('sign-mode').value;
        let pngImage;

        if (mode === 'draw') {
            // Get from Canvas
            const dataUrl = this.canvas.toDataURL('image/png');
            pngImage = await pdfDoc.embedPng(dataUrl);
        } else {
            // Get from File Input
            const fileInput = document.getElementById('sign-img-upload');
            if (!fileInput.files.length) return alert("Please upload a signature image.");
            const imgBytes = await fileInput.files[0].arrayBuffer();
            pngImage = await pdfDoc.embedPng(imgBytes); // Assuming PNG for transparency
        }

        const pages = pdfDoc.getPages();
        const targetPageValue = document.getElementById('sign-page').value;
        const targetPage = targetPageValue === 'first' ? pages[0] : pages[pages.length - 1];

        const { width, height } = targetPage.getSize();
        
        // Scale signature to a reasonable size relative to the page
        const maxSignWidth = width * 0.3; // Take up max 30% of page width
        const pngDims = pngImage.scaleToFit(maxSignWidth, maxSignWidth);

        // Calculate Position Placement
        const position = document.getElementById('sign-position').value;
        let x = 50, y = 50; // default margin
        
        if (position === 'bottom-left') {
            x = 50;
            y = 50;
        } else if (position === 'bottom-right') {
            x = width - pngDims.width - 50;
            y = 50;
        } else if (position === 'top-left') {
            x = 50;
            y = height - pngDims.height - 50;
        } else if (position === 'top-right') {
            x = width - pngDims.width - 50;
            y = height - pngDims.height - 50;
        }

        targetPage.drawImage(pngImage, {
            x: x,
            y: y,
            width: pngDims.width,
            height: pngDims.height,
        });

        const bytes = await pdfDoc.save();
        downloadBlob(bytes, "signed_brutal.pdf");
    }
};

document.addEventListener('DOMContentLoaded', () => SignModule.init());