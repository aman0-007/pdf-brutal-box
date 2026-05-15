const StampModule = {
    activePdfBytes: null,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        document.getElementById('stamp-status').innerHTML = `📄 Loaded: <b>${fileObj.name}</b> (${fileObj.pageCount} Pages)`;
        document.getElementById('process-stamp').disabled = false;
    },

    async execute() {
        const btn = document.getElementById('process-stamp');
        const position = document.getElementById('stamp-position').value;
        const formatStr = document.getElementById('stamp-format').value || "Page {n} of {total}";
        
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ STAMPING PAGES...";

        setTimeout(async () => {
            try {
                const pdfDoc = await PDFLib.PDFDocument.load(this.activePdfBytes);
                const pages = pdfDoc.getPages();
                const totalPages = pages.length;

                // Embed standard font to calculate width
                const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
                const fontSize = 12;

                pages.forEach((page, index) => {
                    const currentPage = index + 1;
                    const text = formatStr.replace('{n}', currentPage).replace('{total}', totalPages);
                    
                    const textWidth = font.widthOfTextAtSize(text, fontSize);
                    const { width, height } = page.getSize();

                    // Calculate X and Y coordinates
                    const x = (width / 2) - (textWidth / 2); // Perfectly centered horizontally
                    const y = position === 'bottom' ? 30 : height - 40; // 30px margin from top or bottom

                    page.drawText(text, {
                        x: x,
                        y: y,
                        size: fontSize,
                        font: font,
                        color: PDFLib.rgb(0, 0, 0), // Solid Black
                    });
                });

                const bytes = await pdfDoc.save();
                downloadBlob(bytes, "stamped_brutal.pdf");

            } catch (error) {
                alert("Error stamping PDF: " + error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }, 50);
    }
};

document.getElementById('process-stamp').addEventListener('click', () => StampModule.execute());