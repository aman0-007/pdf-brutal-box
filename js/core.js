pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const App = { currentTool: 'tool-merge' };

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDragAndDrop();
});

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.tool-view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active-view'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('active-view');
            App.currentTool = target;
        });
    });
}

function initDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.background = "var(--accent)"; });
    dropZone.addEventListener('dragleave', () => dropZone.style.background = "#f1f1f1");
    
    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.style.background = "#f1f1f1";
        processFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        processFiles(e.target.files);
        fileInput.value = ''; 
    });
}

async function processFiles(fileList) {
    const pdfs = [];
    const images = [];
    
    for (let file of fileList) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        
        if (file.type === "application/pdf") {
            const pdfDoc = await PDFLib.PDFDocument.load(bytes);
            pdfs.push({ name: file.name, bytes: bytes, pageCount: pdfDoc.getPageCount() });
        } else if (file.type.startsWith("image/")) {
            images.push({ name: file.name, type: file.type, bytes: bytes });
        }
    }

    // Route logic
    if (App.currentTool === 'tool-merge' && pdfs.length > 0) MergeModule.addFiles(pdfs);
    if (App.currentTool === 'tool-rotate' && pdfs.length > 0) RotateModule.loadFile(pdfs[0]); // Only takes 1
    if (App.currentTool === 'tool-img2pdf' && images.length > 0) Img2PdfModule.addFiles(images);
    if (App.currentTool === 'tool-pdf2img' && pdfs.length > 0) Pdf2ImgModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-split' && pdfs.length > 0) SplitModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-watermark' && pdfs.length > 0) WatermarkModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-sign' && pdfs.length > 0) SignModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-compress' && pdfs.length > 0) CompressModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-reorder-pages' && pdfs.length > 0) ReorderModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-stamp' && pdfs.length > 0) StampModule.loadFile(pdfs[0]);
    if (App.currentTool === 'tool-ghost' && pdfs.length > 0) GhostModule.loadFile(pdfs[0]);
}

function downloadBlob(data, fileName) {
    const blob = new Blob([data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}