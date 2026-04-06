// ── Theme palette data ────────────────────────────────────────────────────────

const THEME_PALETTES = {
    Neo_brutalism_style: {
        others: [
            { c: "#f5f0e8", l: "Cream" },
            { c: "#fff", l: "White" },
            { c: "#d6c9a8", l: "Sand" },
            { c: "#FFE000", l: "Yellow" },
            { c: "#e63329", l: "Red" },
            { c: "#111", l: "Black" },
        ],
        mine: [
            { c: "#FFE000", l: "Yellow" },
            { c: "#e63329", l: "Red" },
            { c: "#1a3caa", l: "Blue" },
            { c: "#111", l: "Black" },
            { c: "#fff", l: "White" },
            { c: "#f5c500", l: "Gold" },
        ],
        bg: [
            { c: "#f5f0e8", l: "Cream" },
            { c: "#fff", l: "White" },
            { c: "#111", l: "Black" },
            { c: "#FFE000", l: "Yellow" },
            { c: "#e63329", l: "Red" },
            { c: "#222", l: "Dark" },
        ],
        text: [
            { c: "#0a0a0a", l: "Black" },
            { c: "#fff", l: "White" },
            { c: "#FFE000", l: "Yellow" },
            { c: "#e63329", l: "Red" },
        ],
    },
    style: {
        others: [
            { c: "#efefef", l: "Light" },
            { c: "#fff", l: "White" },
            { c: "#e8d5ff", l: "Lavender" },
            { c: "#d0f0f0", l: "Mint" },
            { c: "#ffe0e0", l: "Blush" },
            { c: "#ddeeff", l: "Sky" },
        ],
        mine: [
            { c: "#26d0ce", l: "Teal" },
            { c: "#a78bfa", l: "Purple" },
            { c: "#56aee2", l: "Sky" },
            { c: "#f472b6", l: "Rose" },
            { c: "#6ee7b7", l: "Mint" },
            { c: "#fdba74", l: "Peach" },
        ],
        bg: [
            { c: "#ffffff", l: "White" },
            { c: "#f5f5f5", l: "Soft" },
            { c: "#f3eeff", l: "Lavender" },
            { c: "#edfff5", l: "Mint" },
            { c: "#fff0f0", l: "Blush" },
            { c: "#f0f8ff", l: "Sky" },
        ],
        text: [
            { c: "#1a1a1a", l: "Dark" },
            { c: "#6d28d9", l: "Purple" },
            { c: "#0d9488", l: "Teal" },
            { c: "#000", l: "Black" },
        ],
    },
    retro_futurism: {
        others: [
            { c: "#0b1535", l: "Navy" },
            { c: "#060816", l: "Space" },
            { c: "#0d0f2a", l: "Midnight" },
            { c: "#052028", l: "Teal" },
            { c: "#110822", l: "Purple" },
            { c: "#000", l: "Black" },
        ],
        mine: [
            { c: "#0e2040", l: "Deep" },
            { c: "#001020", l: "Abyss" },
            { c: "#001830", l: "Ocean" },
            { c: "#200015", l: "Magenta" },
            { c: "#003333", l: "Cyan" },
            { c: "#0a0a1e", l: "Void" },
        ],
        bg: [
            { c: "#05061a", l: "Space" },
            { c: "#060c1a", l: "Navy" },
            { c: "#000", l: "Black" },
            { c: "#0e0520", l: "Purple" },
            { c: "#0a0a1a", l: "Dark" },
            { c: "#011120", l: "Teal" },
        ],
        text: [
            { c: "#00f5ff", l: "Cyan" },
            { c: "#ff00aa", l: "Magenta" },
            { c: "#c0c8d8", l: "Silver" },
            { c: "#fff", l: "White" },
        ],
    },
    glassmorphism: {
        others: [
            { c: "#e8e0ff", l: "Lavender" },
            { c: "#ffe0f0", l: "Rose" },
            { c: "#e0f0ff", l: "Sky" },
            { c: "#e0fff0", l: "Mint" },
            { c: "#fff8e0", l: "Peach" },
            { c: "#f8f8ff", l: "Frost" },
        ],
        mine: [
            { c: "#c4b5fd", l: "Violet" },
            { c: "#f9a8d4", l: "Pink" },
            { c: "#93c5fd", l: "Blue" },
            { c: "#6ee7b7", l: "Mint" },
            { c: "#fcd34d", l: "Gold" },
            { c: "#a5f3fc", l: "Cyan" },
        ],
        bg: [
            { c: "#e0d7f8", l: "Purple" },
            { c: "#fce7f3", l: "Rose" },
            { c: "#dbeafe", l: "Sky" },
            { c: "#d1fae5", l: "Mint" },
            { c: "#ffedd5", l: "Peach" },
            { c: "#f8f8f8", l: "White" },
        ],
        text: [
            { c: "#1e1b4b", l: "Dark" },
            { c: "#881337", l: "Rose" },
            { c: "#1e3a5f", l: "Navy" },
            { c: "#064e3b", l: "Green" },
        ],
    },
    cyberpunk_terminal: {
        others: [
            { c: "#111111", l: "Dark" },
            { c: "#0a1a0a", l: "Matrix" },
            { c: "#0f0f0f", l: "Coal" },
            { c: "#1a1a1a", l: "Smoke" },
            { c: "#001a10", l: "Teal" },
            { c: "#000", l: "Black" },
        ],
        mine: [
            { c: "#0a1a0a", l: "Matrix" },
            { c: "#000", l: "Black" },
            { c: "#001a10", l: "Teal" },
            { c: "#1a0010", l: "Magenta" },
            { c: "#00000a", l: "Navy" },
            { c: "#050a05", l: "Deep" },
        ],
        bg: [
            { c: "#0d0d0d", l: "Terminal" },
            { c: "#000", l: "Black" },
            { c: "#111", l: "Smoke" },
            { c: "#050a05", l: "Matrix" },
            { c: "#000510", l: "Navy" },
            { c: "#0a0005", l: "Purple" },
        ],
        text: [
            { c: "#00ff41", l: "Green" },
            { c: "#00ffff", l: "Cyan" },
            { c: "#ffb000", l: "Amber" },
            { c: "#fff", l: "White" },
        ],
    },
    bauhaus: {
        others: [
            { c: "#f8f5ef", l: "Off-White" },
            { c: "#ede8dc", l: "Warm" },
            { c: "#d6d0c4", l: "Grey" },
            { c: "#e8e0d0", l: "Cream" },
            { c: "#fff", l: "White" },
            { c: "#c8c0b0", l: "Pebble" },
        ],
        mine: [
            { c: "#f5c500", l: "Yellow" },
            { c: "#e63329", l: "Red" },
            { c: "#1a3caa", l: "Blue" },
            { c: "#111", l: "Black" },
            { c: "#e06c00", l: "Orange" },
            { c: "#2d6a2d", l: "Green" },
        ],
        bg: [
            { c: "#f8f5ef", l: "Off-White" },
            { c: "#f5c500", l: "Yellow" },
            { c: "#e63329", l: "Red" },
            { c: "#1a3caa", l: "Blue" },
            { c: "#111", l: "Black" },
            { c: "#fff", l: "White" },
        ],
        text: [
            { c: "#111111", l: "Black" },
            { c: "#f8f5ef", l: "White" },
            { c: "#f5c500", l: "Yellow" },
            { c: "#e63329", l: "Red" },
        ],
    },
    skeuomorphic_paper: {
        others: [
            { c: "#fdf8ef", l: "Paper" },
            { c: "#f7f0e3", l: "Cream" },
            { c: "#f5e6c8", l: "Amber" },
            { c: "#ede0c8", l: "Tan" },
            { c: "#faf7f0", l: "Ivory" },
            { c: "#f0e8d8", l: "Linen" },
        ],
        mine: [
            { c: "#fef9e7", l: "Yellow" },
            { c: "#fdf5e4", l: "Cream" },
            { c: "#f5ead8", l: "Tan" },
            { c: "#f0dcc0", l: "Ochre" },
            { c: "#faf7f0", l: "Ivory" },
            { c: "#e8f4f8", l: "Sky" },
        ],
        bg: [
            { c: "#c8b88a", l: "Tan" },
            { c: "#f7f0e3", l: "Paper" },
            { c: "#d4c5a5", l: "Sand" },
            { c: "#b8a07a", l: "Brown" },
            { c: "#8b6914", l: "Dark" },
            { c: "#e8d8b8", l: "Parchment" },
        ],
        text: [
            { c: "#2c1f0e", l: "Ink" },
            { c: "#3d2b1f", l: "Brown" },
            { c: "#6b5540", l: "Medium" },
            { c: "#000", l: "Black" },
        ],
    },
    game_vibe: {
        others: [
            { c: "#1c1c1c", l: "Dark" },
            { c: "#2a0000", l: "Deep Red" },
            { c: "#111111", l: "Black" },
            { c: "#1a0000", l: "Crimson" },
            { c: "#0d0000", l: "Void" },
            { c: "#222222", l: "Smoke" },
        ],
        mine: [
            { c: "#cc0000", l: "Red" },
            { c: "#ff2020", l: "Hot Red" },
            { c: "#7a0000", l: "Blood" },
            { c: "#440000", l: "Dark Red" },
            { c: "#f0f0f0", l: "White" },
            { c: "#080808", l: "Black" },
        ],
        bg: [
            { c: "#0d0000", l: "Void" },
            { c: "#080808", l: "Black" },
            { c: "#111111", l: "Panel" },
            { c: "#1c0000", l: "Crimson" },
            { c: "#0d0d0d", l: "Smoke" },
            { c: "#200000", l: "Deep" },
        ],
        text: [
            { c: "#f0f0f0", l: "White" },
            { c: "#ffffff", l: "Pure" },
            { c: "#cc0000", l: "Red" },
            { c: "#ff2020", l: "Hot Red" },
        ],
    },
    neon_noir: {
        others: [
            { c: "#11111f", l: "Noir" },
            { c: "#080810", l: "Black" },
            { c: "#0a0a14", l: "Dark" },
            { c: "#111120", l: "Smoke" },
            { c: "#100820", l: "Purple" },
            { c: "#000", l: "Pure" },
        ],
        mine: [
            { c: "#160010", l: "Magenta" },
            { c: "#00080e", l: "Cyan" },
            { c: "#0a000a", l: "Violet" },
            { c: "#000018", l: "Blue" },
            { c: "#0e0005", l: "Pink" },
            { c: "#000", l: "Black" },
        ],
        bg: [
            { c: "#0d0d1a", l: "Noir" },
            { c: "#000", l: "Black" },
            { c: "#07080f", l: "Deep" },
            { c: "#050510", l: "Dark" },
            { c: "#111", l: "Smoke" },
            { c: "#0e0318", l: "Purple" },
        ],
        text: [
            { c: "#c4c4d8", l: "Silver" },
            { c: "#ff2d78", l: "Pink" },
            { c: "#1a6dff", l: "Blue" },
            { c: "#00ccff", l: "Cyan" },
        ],
    },
    lofi_cozy: {
        others: [
            { c: "#fdf5e8", l: "Cream" },
            { c: "#f5e6c8", l: "Wheat" },
            { c: "#ffe8d0", l: "Peach" },
            { c: "#e8f4e8", l: "Mint" },
            { c: "#e8e8f0", l: "Mist" },
            { c: "#fff", l: "White" },
        ],
        mine: [
            { c: "#fff5e8", l: "Warm" },
            { c: "#d4f0d4", l: "Sage" },
            { c: "#f0d8d8", l: "Rose" },
            { c: "#d8e8f0", l: "Dusk" },
            { c: "#f0e8d0", l: "Latte" },
            { c: "#ffe8f8", l: "Lilac" },
        ],
        bg: [
            { c: "#f0e0c0", l: "Warm" },
            { c: "#f5e6c8", l: "Wheat" },
            { c: "#d4b896", l: "Tan" },
            { c: "#e8f4e8", l: "Sage" },
            { c: "#f0d8d8", l: "Rose" },
            { c: "#fff8f0", l: "Ivory" },
        ],
        text: [
            { c: "#3a2010", l: "Brown" },
            { c: "#2c1a0e", l: "Espresso" },
            { c: "#1a2c1a", l: "Forest" },
            { c: "#1a1a2a", l: "Navy" },
        ],
    },
};

// ── Swatch builder ────────────────────────────────────────────────────────────
function buildSwatches(containerSel, swatches) {
    const container = document.querySelector(containerSel);
    if (!container) return;
    container.innerHTML = "";
    swatches.forEach(({ c, l }, i) => {
        const span = document.createElement("span");
        span.className = "swatch" + (i === 0 ? " default-swatch" : "");
        span.dataset.color = c;
        span.title = l;
        span.style.cssText = `background:${c};${c === "#fff" || c === "#ffffff" ? "border:1px solid #ccc!important;" : ""}`;
        container.appendChild(span);
    });
}

function rebuildAllSwatches(theme) {
    const p = THEME_PALETTES[theme] || THEME_PALETTES["Neo_brutalism_style"];
    buildSwatches(".others-color-list", p.others);
    buildSwatches(".my-color-list", p.mine);
    buildSwatches(".Background-color-list", p.bg);
    buildSwatches(".txt-color-list", p.text);
    document
        .querySelector(".others-color-list     .swatch:first-child")
        ?.classList.add("others-default-color");
    document
        .querySelector(".my-color-list         .swatch:first-child")
        ?.classList.add("my-default-color");
    document
        .querySelector(".Background-color-list .swatch:first-child")
        ?.classList.add("Background-default-color");
    document
        .querySelector(".txt-color-list        .swatch:first-child")
        ?.classList.add("txt-default-color");
}

// ── Theme switching ───────────────────────────────────────────────────────────
const CSS_VARS = ["--other-msg-bg", "--my-msg-bg", "--body-bg", "--text-color"];

function clearCustomColors() {
    CSS_VARS.forEach((v) => {
        document.documentElement.style.removeProperty(v);
        localStorage.removeItem(v);
    });
}

// Called by onclick="applyTheme(this)" on each .theme-card button
function applyTheme(btn) {
    const theme = btn.dataset.theme;
    document.querySelector(".chat-style").href = "../CSS/" + theme + ".css";
    localStorage.setItem("selectedTheme", theme);
    document
        .querySelectorAll(".theme-card")
        .forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    clearCustomColors();
    rebuildAllSwatches(theme);
}

// Add event listeners to theme cards
document.querySelectorAll(".theme-card").forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn));
});

// ── Background image helpers ──────────────────────────────────────────────────
const randomImageSelector = document.querySelector(".random-image");
const bodyImage = document.querySelector(".body-image");

function setBackgroundImage() {
    if (!bodyImage) return;
    bodyImage.style.backgroundImage = `url(https://picsum.photos/${bodyImage.offsetWidth}/${bodyImage.offsetHeight})`;
}

function clearBackgroundImage() {
    if (!bodyImage) return;
    bodyImage.style.backgroundImage = "";
    randomImageSelector?.classList.remove("active");
    localStorage.setItem("bg-image", "false");
    window.removeEventListener("resize", setBackgroundImage);
}

randomImageSelector?.addEventListener("click", () => {
    randomImageSelector.classList.toggle("active");
    if (randomImageSelector.classList.contains("active")) {
        localStorage.setItem("bg-image", "true");
        setBackgroundImage();
        window.addEventListener("resize", setBackgroundImage);
    } else {
        clearBackgroundImage();
    }
});

// ── Background image — device upload ─────────────────────────────────────────
const bgInput = document.getElementById("bg-upload-input");
const bgUploadBtn = document.getElementById("bgUploadBtn");
const bgClearBtn = document.getElementById("bgClearBtn");

function applyCustomBg(dataUrl) {
    if (!bodyImage) return;
    bodyImage.style.backgroundImage = `url('${dataUrl}')`;
    bodyImage.style.opacity = "1";
    bgUploadBtn?.classList.add("active", "has-image");
    try {
        localStorage.setItem("customBgImage", dataUrl);
    } catch (e) {
        console.warn("Could not persist background image:", e.message);
    }
}

function clearCustomBg() {
    if (!bodyImage) return;
    bodyImage.style.backgroundImage = "";
    bodyImage.style.opacity = "";
    bgUploadBtn?.classList.remove("active", "has-image");
    localStorage.removeItem("customBgImage");
    if (bgInput) bgInput.value = "";
}

bgInput?.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => applyCustomBg(e.target.result);
    reader.readAsDataURL(file);
});

bgClearBtn?.addEventListener("click", function (e) {
    e.stopPropagation();
    clearCustomBg();
});

// ── Color swatch event delegation ─────────────────────────────────────────────
function bindColorListDelegated(containerSel, cssVar) {
    const container = document.querySelector(containerSel);
    if (!container) return;
    container.addEventListener("click", (e) => {
        const s = e.target.closest(".swatch");
        if (!s) return;
        container
            .querySelectorAll(".swatch")
            .forEach((x) => x.classList.remove("active"));
        s.classList.add("active");
        document.documentElement.style.setProperty(cssVar, s.dataset.color);
        localStorage.setItem(cssVar, s.dataset.color);
        if (cssVar === "--body-bg") clearBackgroundImage();
    });
}

bindColorListDelegated(".others-color-list", "--other-msg-bg");
bindColorListDelegated(".my-color-list", "--my-msg-bg");
bindColorListDelegated(".Background-color-list", "--body-bg");
bindColorListDelegated(".txt-color-list", "--text-color");

// ── Settings panel toggle ─────────────────────────────────────────────────────
document.querySelector(".toggle-settings")?.addEventListener("click", () => {
    document.querySelector(".settings-box")?.classList.toggle("open");
});

// ── Bomboclaat ────────────────────────────────────────────────────────────────
const bomboclaatToggle = document.querySelector(".BOMBOCLAAT");
let bomboclaatAudio;

bomboclaatToggle?.addEventListener("click", () =>
    bomboclaatToggle.classList.toggle("active"),
);
bomboclaatToggle?.addEventListener("mouseenter", () => playBOMBOCLAAT(2));

document.addEventListener("keydown", () => {
    if (!bomboclaatToggle?.classList.contains("active")) return;
    playBOMBOCLAAT(1);
});

function playBOMBOCLAAT(time) {
    const n = Math.floor(Math.random() * 30) + 1;
    bomboclaatAudio = new Audio(`../audio/bomboclaat/${n}.mp3`);
    setTimeout(() => {
        if (bomboclaatAudio && !bomboclaatAudio.paused) {
            bomboclaatAudio.pause();
            bomboclaatAudio.currentTime = 0;
        }
    }, time * 1000);
    bomboclaatAudio.play().catch(() => {});
}

// ── Fullscreen overlay (images & iframes) ─────────────────────────────────────
document.addEventListener("click", (e) => {
    if (
        (e.target instanceof HTMLImageElement ||
            e.target instanceof HTMLIFrameElement) &&
        !e.target.parentElement.classList.contains("overlay")
    ) {
        const ov = document.createElement("div");
        ov.className = "overlay";
        const close = document.createElement("div");
        const ne = e.target.cloneNode();
        ne.className = ""; // this line save my life
        close.className = "remove-overlay";
        ov.appendChild(close);
        ov.appendChild(ne);
        document.body.appendChild(ov);
    }
    if (e.target.classList.contains("remove-overlay"))
        e.target.parentElement.remove();
});

// ── Restore all settings on load ──────────────────────────────────────────────
window.addEventListener("load", () => {
    // Restore saved theme
    const savedTheme =
        localStorage.getItem("selectedTheme") || "Neo_brutalism_style";
    document.querySelector(".chat-style").href =
        "../CSS/" + savedTheme + ".css";
    document
        .querySelectorAll(".theme-card")
        .forEach((c) =>
            c.classList.toggle("active", c.dataset.theme === savedTheme),
        );
    rebuildAllSwatches(savedTheme);

    // Restore custom bg image
    const savedBg = localStorage.getItem("customBgImage");
    if (savedBg) {
        applyCustomBg(savedBg);
    } else if (localStorage.getItem("bg-image") === "true") {
        randomImageSelector?.classList.add("active");
        setBackgroundImage();
        window.addEventListener("resize", setBackgroundImage);
    }

    // Restore saved CSS var colors and mark active swatches
    [
        ["--other-msg-bg", ".others-color-list", ".others-default-color"],
        ["--my-msg-bg", ".my-color-list", ".my-default-color"],
        ["--body-bg", ".Background-color-list", ".Background-default-color"],
        ["--text-color", ".txt-color-list", ".txt-default-color"],
    ].forEach(([cssVar, containerSel, defaultSel]) => {
        const saved = localStorage.getItem(cssVar);
        if (saved) {
            document.documentElement.style.setProperty(cssVar, saved);
            document
                .querySelector(containerSel)
                ?.querySelectorAll(".swatch")
                .forEach((s) => {
                    if (s.dataset.color === saved) s.classList.add("active");
                });
        } else {
            document.querySelector(defaultSel)?.classList.add("active");
        }
    });
});
