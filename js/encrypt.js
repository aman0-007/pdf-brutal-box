const EncryptModule = {
    activePdfBytes: null,
    fileName: "",

    async loadFile(fileObj) {
        this.activePdfBytes = fileObj.bytes;
        this.fileName = fileObj.name || "document.pdf";
        
        const statusEl = document.getElementById('encrypt-status');
        if (statusEl) {
            statusEl.innerHTML = `${BrutalIcons.file} Loaded Target: <b>${this.fileName}</b> (${fileObj.pageCount} Pages)`;
        }
        
        const btn = document.getElementById('process-encrypt');
        if (btn) btn.disabled = false;
        
        const resetBtn = document.getElementById('reset-encrypt');
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        
        showBrutalToast(`Loaded ${this.fileName} for encryption.`, "info");
    },

    reset() {
        this.activePdfBytes = null;
        this.fileName = "";
        
        const statusEl = document.getElementById('encrypt-status');
        if (statusEl) statusEl.innerHTML = "Load a PDF to encrypt and set access credentials.";
        
        const passEl = document.getElementById('encrypt-password');
        if (passEl) passEl.value = "";
        
        const confEl = document.getElementById('encrypt-confirm');
        if (confEl) confEl.value = "";
        
        const btn = document.getElementById('process-encrypt');
        if (btn) btn.disabled = true;
        
        const resetBtn = document.getElementById('reset-encrypt');
        if (resetBtn) resetBtn.style.display = 'none';
        
        showBrutalToast("Encryption tool reset.", "info");
    },

    async execute() {
        if (!this.activePdfBytes) {
            showBrutalToast("Please load a PDF first.", "warning");
            return;
        }

        const password = (document.getElementById('encrypt-password').value || "").trim();
        const confirm = (document.getElementById('encrypt-confirm').value || "").trim();

        if (!password) {
            showBrutalToast("Please enter an open password.", "warning");
            document.getElementById('encrypt-password').focus();
            return;
        }

        if (password !== confirm) {
            showBrutalToast("Passwords do not match. Re-enter carefully.", "error");
            document.getElementById('encrypt-confirm').focus();
            return;
        }

        const btn = document.getElementById('process-encrypt');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = `${BrutalIcons.spinner} <span>ENCRYPTING CIPHER...</span>`;

        setTimeout(async () => {
            try {
                if (typeof window.PDFEncrypt === 'undefined' || !window.PDFEncrypt.encryptPDF) {
                    throw new Error("Encryption engine is loading. Please check network connection.");
                }

                const allowPrinting = document.getElementById('encrypt-perm-print').checked;
                const allowCopying = document.getElementById('encrypt-perm-copy').checked;
                const allowModifying = document.getElementById('encrypt-perm-modify').checked;
                const algorithm = document.getElementById('encrypt-algorithm').value || 'AES-256';

                const encryptedBytes = await window.PDFEncrypt.encryptPDF(this.activePdfBytes, password, {
                    ownerPassword: password,
                    algorithm: algorithm,
                    allowPrinting: allowPrinting,
                    allowCopying: allowCopying,
                    allowModifying: allowModifying
                });

                const outName = this.fileName.replace(/\.pdf$/i, '') + "_encrypted.pdf";
                downloadBlob(encryptedBytes, outName);

                btn.innerHTML = `${BrutalIcons.check} <span>ENCRYPTED & DOWNLOADED</span>`;
                showBrutalToast(`Document locked with ${algorithm} cipher!`, "success");

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2500);

            } catch (err) {
                console.error("Encryption failed:", err);
                showBrutalToast("Encryption failed: " + (err.message || err), "error");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }, 50);
    }
};

window.EncryptModule = EncryptModule;
document.getElementById('process-encrypt')?.addEventListener('click', () => EncryptModule.execute());
document.getElementById('reset-encrypt')?.addEventListener('click', () => EncryptModule.reset());
