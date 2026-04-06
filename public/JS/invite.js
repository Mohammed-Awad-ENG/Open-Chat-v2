function fileIcon(t) {
    const ext = String(t).toLowerCase();
    // yes yse i use icons but you cant tell me that isn't cool 🖼
    if (
        ext.startsWith("image/") ||
        [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(ext)
    )
        return "🖼";
    if (
        ext.startsWith("video/") ||
        [".mp4", ".mov", ".webm", ".mkv"].includes(ext)
    )
        return "🎬";
    if (
        ext.startsWith("audio/") ||
        [".mp3", ".wav", ".ogg", ".m4a"].includes(ext)
    )
        return "🎵";
    if (ext === "application/pdf" || ext === ".pdf") return "📄";
    return "📎";
}

async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
    }
}

function showToast(message, duration = 3000) {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => (toast.style.opacity = "1"), 10);

    // Remove after duration
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

(function initInvite() {
    const roomCode = localStorage.getItem("roomCode") || "";
    if (!roomCode.startsWith("pub_")) return;

    /* ── Link CSS file ─────────────────────────────────────────────────────── */
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "../CSS/invite-modal.css";
    document.head.appendChild(link);

    /* ── Build invite URL ──────────────────────────────────────────────────── */
    function getInviteURL() {
        return `${location.origin}/?join=${encodeURIComponent(roomCode)}`;
    }

    /* ── Toast helper ──────────────────────────────────────────────────────── */
    async function copyURL(btnEl) {
        await copyToClipboard(getInviteURL());
        if (btnEl) {
            const prev = btnEl.textContent;
            btnEl.textContent = "✓ Copied!";
            btnEl.classList.add("copied-state");
            setTimeout(() => {
                btnEl.textContent = prev;
                btnEl.classList.remove("copied-state");
            }, 2000);
        }
        showToast("Invite link copied!");
    }

    /* ── Load QR Code library ──────────────────────────────────────────────── */
    function loadQRCodeLibrary() {
        return new Promise((resolve) => {
            if (typeof QRCode !== "undefined") {
                resolve();
                return;
            }

            const script = document.createElement("script");
            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
            script.onload = () => resolve();
            script.onerror = () => resolve(); // Resolve even on error to prevent hanging
            document.head.appendChild(script);
        });
    }

    /* ── Build QR Code ─────────────────────────────────────────────────────── */
    async function generateQRCode(qrCanvas) {
        if (!qrCanvas) return;

        await loadQRCodeLibrary();

        qrCanvas.innerHTML = "";
        if (typeof QRCode !== "undefined") {
            new QRCode(qrCanvas, {
                text: getInviteURL(),
                width: 156,
                height: 156,
                colorDark: "#111",
                colorLight: "#fff",
                correctLevel: QRCode.CorrectLevel.H,
            });
        } else {
            const fallback = document.createElement("div");
            fallback.className = "invite-qr-fallback";
            fallback.style.cssText =
                "padding:14px 10px;color:#111;font-size:.9rem;text-align:center;border:1px solid rgba(0,0,0,.12);border-radius:12px;background:#f9f9f9;";
            fallback.textContent = "QR code unavailable";
            qrCanvas.replaceWith(fallback);
        }
    }

    /* ── Build modal ───────────────────────────────────────────────────────── */
    function buildModal() {
        const modal = document.createElement("div");
        modal.id = "invite-modal";
        modal.innerHTML = `
            <div class="invite-modal-card">
                <div class="invite-modal-header">
                    <span class="invite-modal-title">🔗 Invite to Room</span>
                    <button class="invite-modal-close" id="invite-modal-close" title="Close">✕</button>
                </div>
                <p class="invite-modal-desc">
                    Share this link. Anyone who opens it will jump straight into this room.
                </p>
                <div class="invite-url-row">
                    <input class="invite-url-text" id="invite-url-text" readonly value="${getInviteURL()}">
                    <button class="invite-url-copy" id="invite-url-copy">Copy</button>
                </div>
                <div class="invite-qr-wrap">
                    <div id="invite-qr-canvas"></div>
                    <span class="invite-qr-label">Scan to join</span>
                </div>
                <div class="invite-share-row">
                    <button class="invite-share-btn primary" id="invite-copy-full">
                        📋 Copy Link
                    </button>
                    <button class="invite-share-btn" id="invite-native-share">
                        ↗ Share
                    </button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const qrCanvas = document.getElementById("invite-qr-canvas");
        generateQRCode(qrCanvas);

        // Select all text on focus
        document
            .getElementById("invite-url-text")
            .addEventListener("click", function () {
                this.select();
            });

        // Copy buttons
        document
            .getElementById("invite-url-copy")
            .addEventListener("click", function () {
                copyURL(this);
            });
        document
            .getElementById("invite-copy-full")
            .addEventListener("click", () =>
                copyURL(document.getElementById("invite-url-copy")),
            );

        // Native share (mobile)
        const nativeBtn = document.getElementById("invite-native-share");
        if (navigator.share) {
            nativeBtn.addEventListener("click", () => {
                navigator
                    .share({ title: "Join my chat room", url: getInviteURL() })
                    .catch(() => {});
            });
        } else {
            nativeBtn.addEventListener("click", () =>
                copyURL(document.getElementById("invite-url-copy")),
            );
            nativeBtn.innerHTML = "📋 Copy";
        }

        // Close
        document
            .getElementById("invite-modal-close")
            .addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });

        return modal;
    }

    let modal = null;
    function openModal() {
        if (!modal) modal = buildModal();
        modal.classList.add("open");
    }
    function closeModal() {
        modal?.classList.remove("open");
    }

    /* ── Inject header button ──────────────────────────────────────────────── */
    function injectButton() {
        const headerRight = document.querySelector(".header-right");
        if (!headerRight) return;

        // Don't add twice
        if (document.getElementById("invite-btn")) return;

        const btn = document.createElement("button");
        btn.id = "invite-btn";
        btn.title = "Invite someone to this room";
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>Invite`;

        btn.addEventListener("click", openModal);

        // Insert before home button if present, else append
        const homeBtn = document.getElementById("home-btn");
        homeBtn
            ? headerRight.insertBefore(btn, homeBtn)
            : headerRight.appendChild(btn);
    }

    /* ── Run after DOM is ready ───────────────────────────────────────────────  */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectButton);
    } else {
        // main.js already ran — inject immediately
        injectButton();
    }
})();
