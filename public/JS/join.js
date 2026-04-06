/* ── Avatar image paths ─────────────────────────────────── */
const AVATARS = [
    "../images/avatar_1.jpg",
    "../images/avatar_2.jpg",
    "../images/avatar_3.jpg",
    "../images/avatar_4.jpg",
    "../images/avatar_5.jpg",
];

const THEMES = ["default", "brutalist", "phantom", "lofi", "cyberpunk"];
const THEME_LABEL = {
    default: "DEFAULT",
    brutalist: "BRUTALIST",
    phantom: "Game like",
    lofi: "LOFI COZY",
    cyberpunk: "CYBERPUNK",
};
const THEME_ICON = {
    default: "◑",
    brutalist: "◼",
    phantom: "◈",
    lofi: "",
    cyberpunk: "⟁",
};

let currentTheme = localStorage.getItem("chatTheme") || "default";
let selectedAvatar = localStorage.getItem("avatar") || AVATARS[0];
let currentMode = "rooms";
let themeInterval = null;

/* ── Read invite param early ─────────────────────────────── */
const _inviteRoomId =
    new URLSearchParams(window.location.search).get("join") || null;

/* ── Background image ────────────────────────────────────── */
function setBackgroundImage() {
    if (document.body.classList.contains("theme-default")) {
        document.body.style.backgroundImage = `url(https://picsum.photos/${window.innerWidth}/${window.innerHeight}?random=${Date.now()})`;
    } else {
        document.body.style.backgroundImage = "";
    }
}

/* ── Apply theme ─────────────────────────────────────────── */
function applyTheme(theme) {
    THEMES.forEach((t) => document.body.classList.remove("theme-" + t));
    document.body.classList.add("theme-" + theme);
    document.getElementById("theme-label").textContent = THEME_LABEL[theme];
    document.getElementById("theme-icon").textContent = THEME_ICON[theme];
    localStorage.setItem("chatTheme", theme);
    setBackgroundImage();
}

function startThemeCycle() {
    themeInterval = setInterval(() => {
        const idx = THEMES.indexOf(currentTheme);
        currentTheme = THEMES[(idx + 1) % THEMES.length];
        applyTheme(currentTheme);
    }, 3000);
}

function restartThemeCycle() {
    clearInterval(themeInterval);
    startThemeCycle();
}

/* ── Avatar helpers ──────────────────────────────────────── */
function makeAvatarImg(src, cls) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "avatar";
    img.draggable = false;
    if (cls) img.className = cls;
    return img;
}

function updatePreview(src) {
    const wrap = document.getElementById("avatar-preview");
    wrap.innerHTML = "";
    wrap.appendChild(makeAvatarImg(src, "avatar-preview-img"));
}

function renderAvatarGrid() {
    const grid = document.getElementById("avatar-grid");
    grid.innerHTML = "";
    AVATARS.forEach((src) => {
        const item = document.createElement("div");
        item.className =
            "avatar-item" + (src === selectedAvatar ? " selected" : "");
        item.appendChild(makeAvatarImg(src));
        item.addEventListener("click", () => {
            selectedAvatar = src;
            updatePreview(src);
            localStorage.setItem("avatar", src);
            grid.querySelectorAll(".avatar-item").forEach((el) =>
                el.classList.remove("selected"),
            );
            item.classList.add("selected");
            setTimeout(
                () =>
                    document
                        .getElementById("avatar-grid")
                        .classList.add("hidden"),
                160,
            );
        });
        grid.appendChild(item);
    });
}

/* ── Shake on error ──────────────────────────────────────── */
function shakeField(inputId) {
    const box = document.getElementById(inputId).closest(".input-box");
    box.style.animation = "none";
    void box.offsetWidth;
    box.style.animation = "shake 0.35s ease";
    setTimeout(() => {
        box.style.animation = "";
    }, 400);
}

/* ── Invite banner ───────────────────────────────────────── */
function injectInviteBanner(roomId) {
    // Inject CSS once
    const style = document.createElement("style");
    style.textContent = `
        .invite-banner {
            display: flex; align-items: center; gap: 10px;
            padding: 12px 16px; margin-bottom: 4px;
            border: 2.5px solid #111; border-radius: 4px;
            background: #FFE000; box-shadow: 3px 3px 0 #111;
            animation: invite-pop .3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes invite-pop {
            from { opacity:0; transform: scale(.9) translateY(-6px); }
            to   { opacity:1; transform: none; }
        }
        .invite-banner-icon { font-size: 1.4rem; flex-shrink: 0; }
        .invite-banner-text { flex: 1; min-width: 0; }
        .invite-banner-label {
            font-size: .52rem; font-weight: 700; letter-spacing: .12em;
            text-transform: uppercase; opacity: .55; display: block;
        }
        .invite-banner-room {
            font-size: .75rem; font-weight: 700; letter-spacing: .04em;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .invite-banner-badge {
            font-size: .5rem; font-weight: 700; letter-spacing: .1em;
            text-transform: uppercase; padding: 3px 8px; border-radius: 20px;
            border: 1.5px solid #111; background: #111; color: #FFE000;
            flex-shrink: 0;
        }
    `;
    document.head.appendChild(style);

    const banner = document.createElement("div");
    banner.className = "invite-banner";
    banner.innerHTML = `
        <span class="invite-banner-icon">🔗</span>
        <div class="invite-banner-text">
            <span class="invite-banner-label">Room invite</span>
            <span class="invite-banner-room">${roomId}</span>
        </div>
        <span class="invite-banner-badge">INVITED</span>`;

    // Insert before the input-box
    const form = document.getElementById("join-form");
    const inputBox = form.querySelector(".input-box");
    form.insertBefore(banner, inputBox);

    // Hide mode selector — invite always joins a room
    const modeSelector = form.querySelector(".mode-selector");
    if (modeSelector) modeSelector.style.display = "none";

    // Update the submit button label
    const submitBtn = form.querySelector(".sign-in-btn");
    if (submitBtn) submitBtn.textContent = "JOIN ROOM →";
}

/* ── DOMContentLoaded ────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    applyTheme(currentTheme);
    updatePreview(selectedAvatar);
    renderAvatarGrid();
    startThemeCycle();

    // Clear stale matchmaking state on fresh join
    localStorage.removeItem("skipList");
    localStorage.removeItem("dmRoomId");

    // ── Handle invite link ────────────────────────────────────────────────────
    if (_inviteRoomId) {
        // Don't clear a stale roomCode if we have an invite — we'll set it on submit
        // But DO clear it now so history doesn't leak
        localStorage.removeItem("roomCode");
        injectInviteBanner(_inviteRoomId);
    } else {
        localStorage.removeItem("roomCode");
    }

    const savedName = localStorage.getItem("userName");
    if (savedName) document.getElementById("name-input").value = savedName;

    /* Manual theme toggle */
    document.getElementById("theme-toggle").addEventListener("click", () => {
        const idx = THEMES.indexOf(currentTheme);
        currentTheme = THEMES[(idx + 1) % THEMES.length];
        applyTheme(currentTheme);
        restartThemeCycle();
    });

    /* Avatar toggle */
    ["avatar-preview", "avatar-toggle"].forEach((id) => {
        document.getElementById(id).addEventListener("click", () => {
            document.getElementById("avatar-grid").classList.toggle("hidden");
        });
    });

    /* Close avatar grid on outside click */
    document.addEventListener("click", (e) => {
        if (!document.querySelector(".avatar-section").contains(e.target))
            document.getElementById("avatar-grid").classList.add("hidden");
    });

    /* Mode switch */
    document.querySelectorAll(".mode-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            currentMode = btn.dataset.mode;
            document
                .querySelectorAll(".mode-btn")
                .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    /* Resize */
    window.addEventListener("resize", () => {
        if (currentTheme === "default") setBackgroundImage();
    });

    /* ── Form submit ─────────────────────────────────────────────────────────── */
    document.getElementById("join-form").addEventListener("submit", (e) => {
        e.preventDefault();

        const nameVal = document.getElementById("name-input").value.trim();
        if (!nameVal) {
            shakeField("name-input");
            return;
        }

        localStorage.setItem("userName", nameVal);
        localStorage.setItem("avatar", selectedAvatar);

        if (_inviteRoomId) {
            // ── Invite flow: skip matching, go straight to the room ───────────
            localStorage.setItem("roomCode", _inviteRoomId);
            localStorage.setItem("chatMode", "rooms");
            window.location.href = "/chatRoom";
        } else {
            // ── Normal flow: matching screen assigns a room ───────────────────
            localStorage.setItem("chatMode", currentMode); // 'rooms' | 'dm'
            window.location.href = "/matching";
        }
    });
});
