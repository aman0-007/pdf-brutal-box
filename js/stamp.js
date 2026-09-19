const StampModule = {
    activePdfBytes: null,

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        const statusEl = document.getElementById('stamp-status');
        if (statusEl) {
            statusEl.innerHTML = `${BrutalIcons.file} Loaded: <b>${fileObj.name}</b> (${fileObj.pageCount} Pages)`;
        }
        const btn = document.getElementById('process-stamp');
        if (btn) btn.disabled = false;
        const resetBtn = document.getElementById('reset-stamp');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        showBrutalToast(`Loaded ${fileObj.name} for stamping.`, "info");
    },

    reset() {
        this.activePdfBytes = null;
        const statusEl = document.getElementById('stamp-status');
        if (statusEl) statusEl.innerHTML = "Load a PDF to embed page numbers.";
        const btn = document.getElementById('process-stamp');
        if (btn) btn.disabled = true;
        const resetBtn = document.getElementById('reset-stamp');
        if (resetBtn) resetBtn.style.display = 'none';
        showBrutalToast("Auto-Stamper reset to blank.", "info");
    },

    async execute() {
        if (!this.activePdfBytes) {
            showBrutalToast("Please load a PDF first.", "warning");
            return;
        }

        const btn = document.getElementById('process-stamp');
        const position = document.getElementById('stamp-position')?.value || "bottom";
        const formatStr = document.getElementById('stamp-format')?.value || "Page {n} of {total}";
        const fontSize = parseInt(document.getElementById('stamp-size')?.value || "12", 10);
        const colorChoice = document.getElementById('stamp-color')?.value || "black";
        const stampStyle = document.getElementById('stamp-style')?.value || "plain";
        const marginOffset = parseInt(document.getElementById('stamp-margin')?.value || "25", 10);

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>STAMPING PAGES...</span>`;

        setTimeout(async () => {
            try {
                const pdfDoc = await PDFLib.PDFDocument.load(this.activePdfBytes);
                const pages = pdfDoc.getPages();
                const totalPages = pages.length;

                // Embed bold standard font
                const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

                // Map colors
                let textColor = PDFLib.rgb(0, 0, 0);
                if (colorChoice === 'red') textColor = PDFLib.rgb(0.83, 0.18, 0.18);
                else if (colorChoice === 'blue') textColor = PDFLib.rgb(0.1, 0.46, 0.82);
                else if (colorChoice === 'white') textColor = PDFLib.rgb(1, 1, 1);

                pages.forEach((page, index) => {
                    const currentPage = index + 1;
                    const text = formatStr.replace(/\{n\}/g, currentPage).replace(/\{total\}/g, totalPages);
                    
                    const textWidth = font.widthOfTextAtSize(text, fontSize);
                    const textHeight = font.heightAtSize(fontSize);
                    const { width, height } = page.getSize();

                    // Calculate X coordinates
                    let x = (width / 2) - (textWidth / 2); // default center
                    if (position.includes('left')) {
                        x = marginOffset;
                    } else if (position.includes('right')) {
                        x = width - textWidth - marginOffset;
                    }

                    // Calculate Y coordinates
                    let y = marginOffset; // default bottom
                    if (position.startsWith('top')) {
                        y = height - marginOffset - textHeight;
                    }

                    // Optional Pill or Box background
                    const paddingX = 8;
                    const paddingY = 4;
                    const boxX = x - paddingX;
                    const boxY = y - paddingY;
                    const boxW = textWidth + (paddingX * 2);
                    const boxH = textHeight + (paddingY * 2);

                    if (stampStyle === 'pill') {
                        // Solid background pill
                        const bgColor = colorChoice === 'white' ? PDFLib.rgb(0, 0, 0) : PDFLib.rgb(0.96, 0.95, 0.92);
                        page.drawRectangle({
                            x: boxX,
                            y: boxY,
                            width: boxW,
                            height: boxH,
                            color: bgColor,
                            borderColor: PDFLib.rgb(0, 0, 0),
                            borderWidth: 1.5,
                        });
                    } else if (stampStyle === 'box') {
                        // Framed box with transparent/white background
                        page.drawRectangle({
                            x: boxX,
                            y: boxY,
                            width: boxW,
                            height: boxH,
                            color: PDFLib.rgb(1, 1, 1),
                            borderColor: textColor,
                            borderWidth: 1.5,
                        });
                    }

                    page.drawText(text, {
                        x: x,
                        y: y,
                        size: fontSize,
                        font: font,
                        color: textColor,
                    });
                });

                const bytes = await pdfDoc.save();
                downloadBlob(bytes, "stamped_brutal.pdf");
                showBrutalToast(`Stamped ${totalPages} pages with custom layout!`, "success");

            } catch (error) {
                console.error("Error stamping PDF:", error);
                showBrutalToast("Error stamping PDF: " + error.message, "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }, 50);
    }
};

window.StampModule = StampModule;
document.getElementById('process-stamp').addEventListener('click', () => StampModule.execute());
document.getElementById('reset-stamp')?.addEventListener('click', () => StampModule.reset());