// ─── Identity & Room ─────────────────────────────────────────────────────────
let userId = localStorage.getItem("userId");
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userId", userId);
}

const socket = io({ auth: { userId } });
const roomId = localStorage.getItem("roomCode");
const name = localStorage.getItem("userName");
if (!roomId || !name) window.location.href = "/";
let photo = localStorage.getItem("avatar");
socket.emit("join-room", { roomId, name, photo });

socket.on("room-full", ({ maxSize }) => {
    localStorage.removeItem("roomCode");
    document.body.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;
        justify-content:center;min-height:100vh;gap:16px;font-family:inherit;text-align:center;padding:24px">
        <h2>ROOM IS FULL</h2><p>Max ${maxSize} people.</p><a href="/">Back Home</a>
    </div>`;
});

// ─── Leave helpers ────────────────────────────────────────────────────────────
function leaveAndGoHome() {
    if (roomId && socket.connected) socket.emit("leave-room", { roomId });
    localStorage.removeItem("roomCode");
    window.location.href = "/";
}
window.addEventListener("beforeunload", () => {
    if (roomId && socket.connected) socket.emit("leave-room", { roomId });
});

// ─── Room capacity ────────────────────────────────────────────────────────────
socket.on("room-info", ({ memberCount, maxSize }) => {
    const pill = document.getElementById("room-cap-pill");
    if (pill) pill.textContent = `${memberCount} / ${maxSize}`;
});

// ─── Header scroll-hide ───────────────────────────────────────────────────────
let lastScrollY = 0;
const chatHeader = document.querySelector(".chat-header");
window.addEventListener(
    "scroll",
    () => {
        const Y = window.scrollY;
        if (Math.abs(Y - lastScrollY) < 5) return;
        chatHeader?.classList.toggle("hidden", Y > lastScrollY);
        lastScrollY = Y;
    },
    { passive: true },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTime() {
    const d = new Date();
    let h = d.getHours(),
        m = d.getMinutes();
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m < 10 ? "0" + m : m} ${ap}`;
}
function esc(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
function fmtName(n) {
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : "User";
}
function genMsgId() {
    return "m_" + Math.random().toString(36).slice(2, 11);
}
function fmtBytes(b) {
    return b < 1024
        ? b + " B"
        : b < 1048576
          ? (b / 1024).toFixed(1) + " KB"
          : (b / 1048576).toFixed(1) + " MB";
}
function fileIcon(t) {
    // yes yse i use icons but you cant tell me that isn't cool 🖼
    const ext = String(t).toLowerCase();
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

// ─────────────────────────────────────────────────────────────────────────────
//  AVATAR MODE — driven by avatar_modes.css
//  Sets body[data-avatar-mode] and manages the settings panel section.
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_MODE_KEY = "avatarMode";
const AVATAR_MODES = [
    { key: "bottom-corner", label: "Bottom Corner" },
    { key: "side-out", label: "Side Out" },
    { key: "bottom-out", label: "Bottom Outside" },
    { key: "top-out", label: "Top Outside" },
];

function applyAvatarMode(mode) {
    const valid = AVATAR_MODES.map((m) => m.key);
    if (!valid.includes(mode)) mode = valid[0];
    document.body.dataset.avatarMode = mode;
    localStorage.setItem(AVATAR_MODE_KEY, mode);
    document
        .querySelectorAll("._av-mode-btn")
        .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
}

applyAvatarMode(localStorage.getItem(AVATAR_MODE_KEY));

// Inject the avatar-mode section into the settings panel.
// Runs on load so Settings.js has already built its sections.
window.addEventListener("load", () => {
    if (document.getElementById("_av-mode-section")) return;
    const scroll = document.querySelector(".settings-scroll-inner");
    if (!scroll) return;

    const sec = document.createElement("div");
    sec.className = "settings-section";
    sec.id = "_av-mode-section";
    sec.innerHTML = `<h3 class="settings-section-title">Avatar Position</h3>`;

    const grid = document.createElement("div");
    grid.style.cssText =
        "display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;";

    AVATAR_MODES.forEach(({ key, label }) => {
        const btn = document.createElement("button");
        btn.className = "_av-mode-btn";
        btn.dataset.mode = key;
        btn.textContent = label;
        btn.style.cssText =
            "padding:8px 6px;border:2px solid rgba(0,0,0,.16);border-radius:4px;cursor:pointer;font-size:.6rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:transparent;color:inherit;transition:border-color .15s,background .15s;";
        btn.addEventListener("click", () => applyAvatarMode(key));
        btn.addEventListener("mouseenter", () => {
            if (!btn.classList.contains("active"))
                btn.style.borderColor = "rgba(0,0,0,.4)";
        });
        btn.addEventListener("mouseleave", () => {
            if (!btn.classList.contains("active"))
                btn.style.borderColor = "rgba(0,0,0,.16)";
        });
        grid.appendChild(btn);
    });

    sec.appendChild(grid);

    // Style the active button — minimal inline (theme handles the rest)
    const styleActive = document.createElement("style");
    styleActive.textContent =
        "._av-mode-btn.active{border-color:#111!important;background:#ffe000!important;}";
    document.head.appendChild(styleActive);

    const bomb = scroll.querySelector(".Bomboclaat-section");
    bomb ? scroll.insertBefore(sec, bomb) : scroll.appendChild(sec);

    applyAvatarMode(localStorage.getItem(AVATAR_MODE_KEY));
});

// Re-apply after Settings.js's own load handler runs (it may reset CSS)
window.addEventListener("load", () =>
    applyAvatarMode(localStorage.getItem(AVATAR_MODE_KEY)),
);

// ─────────────────────────────────────────────────────────────────────────────
//  REACTIONS — server enforces one per user via Map<userId, emoji>
// ─────────────────────────────────────────────────────────────────────────────
const EMOJIS = ["❤️", "😂", "🔥", "😮", "😢", "👍", "💀", "🤙"];
const _myReactions = {};
let _pickerMsgId = null;
let _pickerTimer = null;

function getOrCreatePicker() {
    let p = document.getElementById("_react-picker");
    if (!p) {
        p = document.createElement("div");
        p.id = "_react-picker";
        p.style.cssText =
            "position:fixed;z-index:99999;display:none;align-items:center;gap:2px;padding:6px 10px;background:#fff;border:2px solid #111;box-shadow:3px 3px 0 #111;border-radius:28px;white-space:nowrap;";
        document.body.appendChild(p);
        p.addEventListener("mouseenter", () => clearTimeout(_pickerTimer));
        p.addEventListener("mouseleave", () => {
            _pickerTimer = setTimeout(hidePicker, 350);
        });
    }
    return p;
}

function showPicker(triggerEl, msgId) {
    clearTimeout(_pickerTimer);
    _pickerMsgId = msgId;
    const p = getOrCreatePicker();
    p.innerHTML = "";
    p.style.display = "flex";
    EMOJIS.forEach((em) => {
        const btn = document.createElement("button");
        btn.textContent = em;
        btn.style.cssText =
            "background:none;border:none;cursor:pointer;font-size:1.2rem;padding:2px 3px;border-radius:6px;line-height:1;transition:transform .1s;";
        btn.onmouseover = () => (btn.style.transform = "scale(1.3)");
        btn.onmouseout = () => (btn.style.transform = "");
        if (_myReactions[msgId] === em) {
            btn.style.outline = "2px solid #ffe000";
            btn.style.outlineOffset = "1px";
        }
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            socket.emit("react", { roomId, msgId, emoji: em });
            hidePicker();
        });
        p.appendChild(btn);
    });
    requestAnimationFrame(() => {
        const r = triggerEl.getBoundingClientRect(),
            pw = p.offsetWidth || 280,
            ph = p.offsetHeight || 46;
        let top = r.top - ph - 8;
        if (top < 8) top = r.bottom + 8;
        let left = r.left + r.width / 2 - pw / 2;
        if (left < 8) left = 8;
        if (left + pw > window.innerWidth - 8)
            left = window.innerWidth - pw - 8;
        p.style.top = top + "px";
        p.style.left = left + "px";
    });
}

function hidePicker() {
    const p = document.getElementById("_react-picker");
    if (p) p.style.display = "none";
    _pickerMsgId = null;
}
document.addEventListener(
    "click",
    (e) => {
        if (
            !e.target.closest("#_react-picker") &&
            !e.target.closest("._react-btn")
        )
            hidePicker();
    },
    { passive: true },
);

function updateReactionBar(msgId, reactionsData) {
    const li = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (!li) return;
    let myEmoji = null;
    for (const [em, voters] of Object.entries(reactionsData)) {
        if (voters.includes(userId)) {
            myEmoji = em;
            break;
        }
    }
    _myReactions[msgId] = myEmoji;
    if (_pickerMsgId === msgId) {
        document.querySelectorAll("#_react-picker button").forEach((b) => {
            const own = b.textContent.trim() === myEmoji;
            b.style.outline = own ? "2px solid #ffe000" : "";
            b.style.outlineOffset = own ? "1px" : "";
        });
    }
    let bar = li.querySelector("._reaction-bar");
    if (!bar) {
        bar = document.createElement("div");
        bar.className = "_reaction-bar";
        li.appendChild(bar);
    }
    bar.innerHTML = "";
    for (const [em, voters] of Object.entries(reactionsData)) {
        if (!voters.length) continue;
        const isMine = voters.includes(userId);
        const chip = document.createElement("span");
        chip.style.cssText = `display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;cursor:pointer;font-size:.78rem;border:1.5px solid rgba(0,0,0,.15);background:${isMine ? "rgba(255,224,0,.5)" : "rgba(255,255,255,.65)"};margin:2px 2px 0 0;user-select:none;`;
        chip.innerHTML = `${em}<span style="font-size:.65rem;font-weight:700;color:#111;">${voters.length}</span>`;
        chip.addEventListener("click", () =>
            socket.emit("react", { roomId, msgId, emoji: em }),
        );
        bar.appendChild(chip);
    }
}
socket.on("reaction-update", ({ msgId, reactions }) =>
    updateReactionBar(msgId, reactions),
);

// ─────────────────────────────────────────────────────────────────────────────
//  RENDER MESSAGE — original theme-compatible structure
// ─────────────────────────────────────────────────────────────────────────────
const notifSound = document.querySelector(".send-sound");
let _roomUsers = [];
const _userPhotos = {}; // Map userName -> photoUrl for notifications

function renderMsg(data) {
    if (!data?.name) return;
    const msgId = data.msgId || genMsgId();
    const isMine = data.senderId === userId;
    const msgs = document.getElementById("messages");

    const li = document.createElement("li");
    li.dataset.msgId = msgId;
    li.dataset.senderId = data.senderId;
    li.className = isMine ? "my-message" : "other-message";

    const avatarSrc = data.photo || photo || "../images/avatar_1.jpg";
    li.innerHTML = `<span class="meta">${esc(data.name)}<span class="time">${data.time}</span></span><div>${esc(data.message)}</div>`;

    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = avatarSrc;
    avatar.alt = esc(data.name);
    // avatar.classList.add("avatar");
    avatar.draggable = false;
    li.appendChild(avatar);

    // React button (shown on hover)
    const rb = document.createElement("button");
    rb.className = "_react-btn";
    rb.title = "React";
    rb.style.cssText =
        "position:absolute;bottom:-10px;" +
        (isMine ? "left" : "right") +
        ":-10px;width:20px;height:20px;border-radius:50%;background:#fff;border:1.5px solid rgba(0,0,0,.2);box-shadow:0 1px 4px rgba(0,0,0,.18);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .15s;z-index:2;padding:0;";
    rb.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
    rb.addEventListener("click", (e) => {
        e.stopPropagation();
        showPicker(rb, msgId);
    });
    li.addEventListener("mouseenter", () => {
        rb.style.opacity = "1";
        rb.style.pointerEvents = "all";
        clearTimeout(_pickerTimer);
    });
    li.addEventListener("mouseleave", () => {
        rb.style.opacity = "0";
        rb.style.pointerEvents = "none";
        _pickerTimer = setTimeout(hidePicker, 350);
    });
    li.appendChild(rb);

    msgs.appendChild(li);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    input.focus();
    document.querySelector(".typing-ntf")?.remove();
    notifSound.play().catch(() => {});
    return li;
}

// ─── Send Message ─────────────────────────────────────────────────────────────
const form = document.getElementById("form");
const input = document.getElementById("input");

function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    const msgId = genMsgId(),
        time = getTime();
    renderMsg({
        name: fmtName(name),
        message: msg,
        time,
        senderId: userId,
        msgId,
    });
    socket.emit("chat message", { roomId, message: msg, name, msgId });
    input.value = "";
}
form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
});
document.querySelector(".send").addEventListener("click", sendMessage);

socket.on("send_to_all_and_save", (data) => {
    if (data.senderId !== userId) renderMsg(data);
    let h = JSON.parse(localStorage.getItem("chatHistory")) || [];
    h.push({
        name: data.name,
        time: data.time,
        createdTime: Date.now(),
        msg: data.message,
        sender: data.senderId === userId ? "my-message" : "other-message",
        msgId: data.msgId || genMsgId(),
        senderId: data.senderId,
        roomId,
    });
    localStorage.setItem("chatHistory", JSON.stringify(h));
});

(function loadHistory() {
    const raw = JSON.parse(localStorage.getItem("chatHistory")) || [];
    const DAY = 24 * 60 * 60 * 1000;
    const fresh = raw.filter((m) => m && Date.now() - m.createdTime < DAY);
    localStorage.setItem("chatHistory", JSON.stringify(fresh));
    fresh.forEach((m) => {
        if (!m || m.roomId !== roomId) return;
        renderMsg({
            name: m.name,
            message: m.msg,
            time: m.time,
            senderId: m.senderId || (m.sender === "my-message" ? userId : ""),
            msgId: m.msgId || genMsgId(),
        });
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
})();

// ─── Connection Notifications ─────────────────────────────────────────────────
const connBox = document.querySelector(".connection-msg-box");
function showConn(text, type) {
    const d = document.createElement("div");
    d.className = type;
    d.innerHTML = text;
    connBox.appendChild(d);
    setTimeout(() => d.remove(), type === "join" ? 5000 : 4000);
}
socket.on("join_msg", (u) => showConn(`<span>${u}</span> joined`, "join"));
socket.on("user_disconnect", (u) =>
    showConn(`<span>${u}</span> left`, "disconnect"),
);

// ─── Typing ───────────────────────────────────────────────────────────────────
let typingTimeout;
input.addEventListener("input", () => {
    socket.emit("typing", { roomId, name });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(
        () => socket.emit("typing-stopped", { roomId }),
        1000,
    );
});
socket.on("show-typing-stats", (user) => {
    if (document.querySelector(".typing-ntf")) return;
    const li = document.createElement("li");
    li.className = "typing-ntf";
    li.style.cssText =
        "display:flex;align-items:center;gap:8px;position:relative;";

    const typingUser = _roomUsers.find((u) => u.name === user);
    const avatarSrc =
        typingUser?.photo || _userPhotos[user] || "../images/avatar_1.jpg";

    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = avatarSrc;
    avatar.alt = esc(user);
    avatar.classList.add("avatar");
    const wrapper = document.createElement("span");
    wrapper.style.cssText = "display:flex;align-items:center;gap:4px;";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = esc(user);
    nameSpan.style.cssText = "font-size:.75rem;font-weight:600;";
    wrapper.appendChild(nameSpan);
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        wrapper.appendChild(dot);
    }
    li.appendChild(avatar);
    li.appendChild(wrapper);
    document.getElementById("messages").appendChild(li);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});
socket.on("user-stopped-typing", () =>
    document.querySelector(".typing-ntf")?.remove(),
);

// ─── Audio Recording ──────────────────────────────────────────────────────────
const recordBtn = document.querySelector(".recordBtn");
const recordSound = document.querySelector(".recording");
let mediaRecorder,
    audioChunks = [];
const MIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="12" rx="4" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="9" y1="22" x2="15" y2="22"/></g></svg>`;
const STOP_SVG = `<svg width="15" height="15" viewBox="0 0 17 17" xmlns="http://www.w3.org/2000/svg"><circle cx="8.5" cy="8.5" r="8.5" fill="currentColor"/></svg>`;

recordBtn.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        socket.emit("recording", { roomId, name });
        recordBtn.innerHTML = STOP_SVG;
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: "audio/webm" });
            audioChunks = [];
            const r = new FileReader();
            r.readAsDataURL(blob);
            r.onloadend = () =>
                socket.emit("send-audio", {
                    roomId,
                    audioData: r.result,
                    senderId: userId,
                    senderName: name,
                });
        };
    } else {
        mediaRecorder.stop();
        mediaRecorder.stream?.getTracks().forEach((t) => t.stop());
        recordBtn.innerHTML = MIC_SVG;
    }
});
socket.on("show-recording-ntf", (n) => {
    if (document.querySelector(".recording-ntf")) return;
    const li = document.createElement("li");
    li.className = "recording-ntf";
    li.style.cssText =
        "display:flex;align-items:center;gap:8px;position:relative;";
    const avatarSrc = _userPhotos[n] || "../images/avatar_1.jpg";
    const avatar = document.createElement("img");
    avatar.src = avatarSrc;
    avatar.classList.add("msg-avatar");
    avatar.classList.add("avatar");
    avatar.alt = esc(n);
    const nameSpan = document.createElement("span");
    nameSpan.textContent = esc(n);
    nameSpan.style.cssText = "font-size:.75rem;font-weight:600;";
    const micDiv = document.createElement("div");
    micDiv.innerHTML = MIC_SVG;
    li.appendChild(avatar);
    li.appendChild(nameSpan);
    li.appendChild(micDiv);
    document.getElementById("messages").appendChild(li);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    recordSound.play().catch(() => {});
});
socket.on("send-audio", ({ audioData, senderId, senderName, time }) => {
    document.querySelector(".recording-ntf")?.remove();
    const li = document.createElement("li");
    li.dataset.msgId = "a_" + genMsgId();
    li.dataset.senderId = senderId;
    li.className = senderId === userId ? "my-message" : "other-message";
    li.innerHTML = `<span class="meta">${esc(senderName)}<span class="time">${time}</span></span>`;

    const avatarSrc =
        senderId === userId
            ? photo
            : _userPhotos[senderName] || "../images/avatar_1.jpg";
    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = avatarSrc;
    avatar.alt = esc(senderName);
    avatar.classList.add("avatar");
    avatar.draggable = false;
    li.appendChild(avatar);

    const au = Object.assign(document.createElement("audio"), {
        id: "targetAudio",
        src: audioData,
    });
    const dv = document.createElement("div");
    dv.className = "time-range";
    dv.innerHTML = `<input type="range" value="0" id="progress"><div id="time">00:00</div><div id="playSwitchBtn" class="pause">▶</div>`;
    dv.appendChild(au);
    li.appendChild(dv);
    document.querySelector("#messages").appendChild(li);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    notifSound.play();
    setAudioControls();
});

// ─── Audio Controls ───────────────────────────────────────────────────────────

function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const sec = Math.floor(seconds);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}
// Map to store and cleanup intervals per progress element
const _audioIntervals = new Map();

function setAudioControls() {
    document.querySelectorAll("#progress").forEach((p) => {
        if (p.dataset.bound) return;
        p.dataset.bound = "1";
        const c = p.parentElement.children,
            au = c.targetAudio,
            t = c.time,
            b = c.playSwitchBtn;
        if (!au || !t || !b) return;

        // Setup metadata handler
        au.onloadedmetadata = () => {
            p.max = au.duration || 0;
            p.value = au.currentTime;
            updateTimeDisplay();
        };

        // Setup ended event
        au.onended = () => {
            b.classList.replace("pause", "play");
            b.innerHTML = "▶";
            p.value = 0;
            updateTimeDisplay();
        };

        // Update time display helper
        function updateTimeDisplay() {
            if (!isNaN(au.duration) && isFinite(au.duration)) {
                const remaining = au.duration - au.currentTime;
                t.textContent = formatTime(remaining);
            }
        }

        // Handle slider drag
        p.onchange = () => {
            if (au.src && isFinite(au.duration)) {
                au.currentTime = Math.min(p.value, au.duration);
                if (au.paused) {
                    au.play();
                    b.classList.replace("play", "pause");
                    b.innerHTML = "⏹";
                }
            }
        };

        // Clear any old interval for this progress element
        if (_audioIntervals.has(p)) {
            clearInterval(_audioIntervals.get(p));
        }

        // Create update interval with cleanup
        const intervalId = setInterval(() => {
            // Cleanup if element was removed from DOM
            if (!document.body.contains(p)) {
                clearInterval(intervalId);
                _audioIntervals.delete(p);
                return;
            }
            if (!au || !t || !b) return;

            // Update progress slider
            if (!isNaN(au.duration) && isFinite(au.duration)) {
                p.max = au.duration;
                p.value = au.currentTime;
            }

            // Update time display
            updateTimeDisplay();
        }, 500);

        _audioIntervals.set(p, intervalId);
    });

    // Setup play button handlers
    document.querySelectorAll("#playSwitchBtn").forEach((b) => {
        if (b.dataset.bound) return;
        b.dataset.bound = "1";
        b.addEventListener("click", () => {
            const au = b.parentElement?.children?.targetAudio;
            const p = b.parentElement?.querySelector("#progress");
            if (!au?.src || !p) return;

            if (b.classList.contains("pause")) {
                au.pause();
                b.innerHTML = "▶";
                b.classList.replace("pause", "play");
            } else {
                au.play();
                b.innerHTML = "⏹";
                b.classList.replace("play", "pause");
            }
        });
    });
}

/**
 * Cleanup audio controls when removing from DOM
 */
function cleanupAudioControls(audioElement) {
    const progressEl = audioElement.parentElement?.querySelector("#progress");
    if (progressEl && _audioIntervals.has(progressEl)) {
        clearInterval(_audioIntervals.get(progressEl));
        _audioIntervals.delete(progressEl);
        audioElement.pause();
        audioElement.src = "";
    }
}

// Holds the actual File objects until a requester asks for them.
const _pendingFiles = new Map(); // msgId → File

// Build a file card element (used for both sender and receiver views)
function buildFileCard({
    msgId,
    fileName,
    size,
    isMine,
    senderName,
    status = "idle",
}) {
    const card = document.createElement("div");
    card.dataset.fileCard = msgId;
    card.className = "file-nonmedia-send";
    card.style.cssText =
        "display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:6px;background:rgba(0,0,0,.06);max-width:320px;margin-top:4px;";

    const avatarSrc = isMine
        ? photo
        : _userPhotos[senderName] || "../images/avatar_1.jpg";
    const avatar = document.createElement("img");
    avatar.src = avatarSrc;
    avatar.classList.add("msg-avatar");
    avatar.classList.add("avatar");
    avatar.alt = esc(senderName || "User");

    const icon = document.createElement("span");
    icon.className = "fnm-icon";
    icon.style.cssText =
        "font-size:1.4rem;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;";
    icon.textContent = fileIcon(
        fileName?.split(".").pop() ? "." + fileName.split(".").pop() : "",
    );

    const info = document.createElement("div");
    info.className = "fnm-info";
    info.style.cssText = "flex:1;min-width:0;";
    info.innerHTML = `
        <span class="fnm-name" style="font-size:.78rem;font-weight:700;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(fileName)}">${esc(fileName)}</span>
        <span class="fnm-size" style="font-size:.62rem;opacity:.5;display:block;margin-top:2px;">${fmtBytes(size)}</span>`;

    card.appendChild(avatar);

    const btn = document.createElement("button");
    btn.dataset.fileDlBtn = msgId;
    btn.style.cssText =
        "flex-shrink:0;padding:5px 10px;border-radius:4px;border:1.5px solid currentColor;background:transparent;cursor:pointer;font-size:.62rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;transition:background .15s,opacity .15s;";

    if (isMine) {
        btn.textContent = "Shared ✓";
        btn.style.opacity = ".5";
        btn.style.cursor = "default";
        btn.disabled = true;
    } else {
        btn.innerHTML = "⬇ Download";
        btn.onclick = () => requestFileDownload(msgId, btn);
    }

    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(btn);
    return card;
}

function requestFileDownload(msgId, btn) {
    btn.textContent = "Downloading...";
    btn.style.opacity = ".6";
    btn.style.pointerEvents = "none";
    socket.emit("request-file", { msgId });
}

function setFileCardStatus(msgId, status, text) {
    const btn = document.querySelector(`[data-file-dl-btn="${msgId}"]`);
    if (!btn) return;
    btn.textContent = text;
    if (status === "done" || status === "unavailable") {
        btn.style.pointerEvents = "none";
        btn.style.opacity = ".5";
    }
}

// ── Phase 1: Sender initiates offer ──────────────────────────────────────────
function offerFile(file) {
    if (file.size > 25 * 1024 * 1024) return alert("File too large. Max 25MB.");
    const msgId = "f_" + genMsgId();
    const fName = fmtName(name);
    const time = getTime();

    // Store File object — will be read later when someone requests it
    _pendingFiles.set(msgId, file);

    // Show sender's own card immediately (no binary read yet)
    const li = document.createElement("li");
    li.dataset.msgId = msgId;
    li.dataset.senderId = userId;
    li.className = "my-message";
    li.innerHTML = `<span class="meta">${esc(fName)}<span class="time">${time}</span></span>`;
    li.appendChild(
        buildFileCard({
            msgId,
            fileName: file.name,
            size: file.size,
            isMine: true,
            senderName: fName,
        }),
    );
    document.getElementById("messages").appendChild(li);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

    // Emit metadata ONLY — zero binary
    socket.emit("file-offer", {
        roomId,
        msgId,
        name: file.name,
        size: file.size,
        type: file.type,
    });
}

document.querySelector(".send-file-btn").addEventListener("click", () => {
    const fi = document.querySelector("#send-file");
    fi.click();
    fi.onchange = (e) => {
        if (e.target.files.length > 0) offerFile(e.target.files[0]);
        fi.value = "";
    };
});

// ── Phase 2: Receiver sees the card ──────────────────────────────────────────
socket.on(
    "file-offer",
    ({ msgId, senderName, senderId, name: fileName, size, type, time }) => {
        const li = document.createElement("li");
        li.dataset.msgId = msgId;
        li.dataset.senderId = senderId;
        li.dataset.senderName = senderName;
        li.className = "other-message";
        li.innerHTML = `<span class="meta">${esc(senderName)}<span class="time">${time}</span></span>`;
        li.appendChild(
            buildFileCard({ msgId, fileName, size, isMine: false, senderName }),
        );
        document.getElementById("messages").appendChild(li);
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
        notifSound.play().catch(() => {});
    },
);

// ── Phase 3a: Server tells sender to deliver ──────────────────────────────────
// This event is emitted to the SENDER when someone clicks Download.
socket.on("deliver-file-now", ({ msgId, requesterSocketId }) => {
    const file = _pendingFiles.get(msgId);
    if (!file) {
        // File was closed or page reloaded — can't deliver
        return;
    }
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
        socket.emit("file-delivery", {
            msgId,
            requesterSocketId,
            data: reader.result,
            type: file.type,
        });
    };
    // NOTE: We do NOT delete from _pendingFiles here so other room members
    // can also download. The server cleans up on sender disconnect.
});

// ── Phase 3b: Receiver gets the binary and displays inline ────────
socket.on("file-received", ({ msgId, data, type, name: fileName }) => {
    const li = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (!li) return;
    const senderId = li.dataset.senderId;
    const senderName = li.dataset.senderName;
    const metaSpan = li.querySelector(".meta");
    const name = metaSpan ? metaSpan.childNodes[0].textContent : "User";
    const timeSpan = metaSpan.querySelector(".time");
    const time = timeSpan ? timeSpan.textContent : "";

    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    let element;

    if (type.startsWith("image/")) {
        element = Object.assign(document.createElement("img"), {
            src: url,
            style: "max-width:50vw;",
        });
    } else if (type.startsWith("video/")) {
        element = Object.assign(document.createElement("video"), {
            src: url,
            controls: true,
            style: "width:50vw;",
        });
    } else if (type.startsWith("audio/")) {
        const audio = Object.assign(document.createElement("audio"), {
            id: "targetAudio",
            src: url,
        });
        element = document.createElement("div");
        element.className = "time-range";
        element.innerHTML = `<input type="range" value="0" id="progress"><div id="time">00:00</div><div id="playSwitchBtn" class="pause">▶</div>`;
        element.appendChild(audio);
    } else if (type === "application/pdf") {
        element = Object.assign(document.createElement("iframe"), {
            src: url,
            style: "max-width:50vw;",
            height: 260,
        });
    } else {
        element = Object.assign(document.createElement("a"), {
            href: url,
            target: "_blank",
            textContent: "Open File",
            title: `file type: ${type}`,
            style: "display: block",
        });
    }

    // Remove the file card
    const fileCard = li.querySelector("[data-file-card]");
    if (fileCard) fileCard.remove();

    li.appendChild(element);

    // Add avatar
    const avatarSrc =
        senderId === userId
            ? photo
            : _userPhotos[senderName] || "../images/avatar_1.jpg";
    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = avatarSrc;
    avatar.alt = esc(senderName);
    avatar.classList.add("avatar");
    avatar.draggable = false;
    li.appendChild(avatar);

    li.className = senderId === userId ? "my-message" : "other-message";
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    notifSound.play().catch(() => {});
    if (type.startsWith("audio/")) setAudioControls();
});

// ── File unavailable (sender disconnected) ────────────────────────────────────
socket.on("file-unavailable", ({ msgId }) => {
    setFileCardStatus(msgId, "unavailable", "Unavailable");
    // Also update sender's own card if it's still showing
    const li = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (li && li.dataset.senderId === userId) {
        _pendingFiles.delete(msgId);
    }
});
// ─── People Popup + Kick ──────────────────────────────────────────────────────
const peopleToggle = document.getElementById("peopleToggle");
const peoplePopup = document.getElementById("peoplePopup");
const peoplePopupClose = document.getElementById("peoplePopupClose");
const peopleBadge = document.getElementById("peopleBadge");
const peopleCountBig = document.getElementById("peopleCountBig");
const peopleList = document.getElementById("peopleList");
const liveStatus = document.getElementById("liveStatus");
const _kickState = {};

peopleToggle.addEventListener("click", () =>
    peoplePopup.classList.toggle("open"),
);
peoplePopupClose.addEventListener("click", () =>
    peoplePopup.classList.remove("open"),
);
document.addEventListener("click", (e) => {
    if (!peoplePopup.contains(e.target) && !peopleToggle.contains(e.target))
        peoplePopup.classList.remove("open");
});

function renderPeople(users) {
    _roomUsers = users;
    for (const key in _userPhotos) delete _userPhotos[key];
    users.forEach(({ name: uName, photo: uPhoto }) => {
        _userPhotos[uName] = uPhoto || "../images/avatar_1.jpg";
    });
    peopleBadge.textContent = users.length;
    peopleCountBig.textContent = users.length;
    liveStatus.textContent = users.length > 1 ? "LIVE" : "WAITING";
    liveStatus.style.color = users.length > 1 ? "#2bcc6a" : "#ff9800";
    peopleList.innerHTML = "";
    const myName = (localStorage.getItem("userName") || "").toLowerCase();
    users.forEach(({ name: uName, photo: uPhoto, userId: uid }) => {
        const li = document.createElement("li");
        li.className = "people-list-item";
        li.dataset.userId = uid || "";
        const img = document.createElement("img");
        img.className = "people-list-avatar";
        img.src = uPhoto || "../images/avatar_1.jpg";
        img.alt = uName;
        const info = document.createElement("div");
        info.style.cssText = "flex:1;min-width:0;";
        const ns = document.createElement("span");
        ns.className = "people-list-name";
        ns.textContent = uName;
        const isMe = uName.toLowerCase() === myName;
        if (isMe) {
            const y = document.createElement("span");
            y.style.cssText = "font-size:.5rem;opacity:.4;margin-left:4px;";
            y.textContent = "(you)";
            ns.appendChild(y);
        }
        info.appendChild(ns);
        const kv = uid && _kickState[uid];
        if (kv) {
            const prog = document.createElement("div");
            prog.style.cssText =
                "height:3px;background:rgba(0,0,0,.1);border-radius:2px;margin-top:4px;overflow:hidden;";
            prog.innerHTML = `<div style="height:100%;background:#e63329;width:${Math.round((kv.count / kv.needed) * 100)}%;"></div>`;
            const lbl = document.createElement("span");
            lbl.style.cssText = "font-size:.58rem;opacity:.5;";
            lbl.textContent = ` ${kv.count}/${kv.needed} votes`;
            info.appendChild(prog);
            info.appendChild(lbl);
        }
        li.appendChild(img);
        li.appendChild(info);
        if (!isMe && roomId.startsWith("pub_")) {
            const kb = document.createElement("button");
            kb.textContent = "Kick";
            kb.style.cssText =
                "background:transparent;border:1.5px solid rgba(230,51,41,.4);color:#e63329;border-radius:3px;padding:2px 8px;font-size:.58rem;font-weight:700;cursor:pointer;letter-spacing:.04em;text-transform:uppercase;flex-shrink:0;transition:background .15s;";
            kb.onmouseover = () => (kb.style.background = "rgba(230,51,41,.1)");
            kb.onmouseout = () => (kb.style.background = "transparent");
            kb.onclick = (e) => {
                e.stopPropagation();
                socket.emit("vote-kick", {
                    roomId,
                    targetUserId: li.dataset.userId,
                });
                kb.textContent = "✓ Voted";
                kb.style.pointerEvents = "none";
                kb.style.opacity = ".5";
            };
            li.appendChild(kb);
        }
        peopleList.appendChild(li);
    });
}
socket.on("room-users", renderPeople);

function showToast(msg) {
    const t = document.createElement("div");
    t.style.cssText =
        "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9000;background:#111;color:#ffe000;padding:10px 20px;border-radius:4px;border:2px solid #ffe000;font-size:.72rem;font-weight:700;letter-spacing:.06em;pointer-events:none;white-space:nowrap;";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
socket.on(
    "kick-vote-update",
    ({ targetUserId, targetName, voteCount, needed }) => {
        _kickState[targetUserId] = { count: voteCount, needed };
        showToast(`${voteCount}/${needed} votes to kick ${targetName}`);
        if (_roomUsers.length) renderPeople(_roomUsers);
    },
);
socket.on("user-kicked", ({ targetUserId, targetName }) => {
    delete _kickState[targetUserId];
    showToast(`${targetName} was kicked`);
    if (_roomUsers.length)
        renderPeople(_roomUsers.filter((u) => u.name !== targetName));
});
socket.on("kick-vote-expired", ({ targetUserId }) => {
    delete _kickState[targetUserId];
    if (_roomUsers.length) renderPeople(_roomUsers);
});
socket.on("you-were-kicked", () => {
    localStorage.removeItem("roomCode");
    document.body.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;
        justify-content:center;min-height:100vh;gap:16px;font-family:inherit;text-align:center;">
        <h2>YOU WERE KICKED</h2><p>The room voted you out.</p><a href="/">Go Home</a>
    </div>`;
});
