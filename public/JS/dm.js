// ── Identity ──────────────────────────────────────────────────────────────────
let userId = localStorage.getItem("userId");
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userId", userId);
}

const name = localStorage.getItem("userName");
const photo = localStorage.getItem("avatar");
const roomId = localStorage.getItem("dmRoomId");
const offerer = localStorage.getItem("dmOfferer");
const users = JSON.parse(localStorage.getItem("dmUsers") || "[]");
if (!name || !roomId) window.location.href = "/";

const me = users.find((u) => u.userId === userId);
const them = users.find((u) => u.userId !== userId);
const iAmOfferer = userId === offerer;

const socket = io({ auth: { userId } });

// ── UI refs ───────────────────────────────────────────────────────────────────
const form = document.getElementById("form");
const input = document.getElementById("input");
const messagesEl = document.getElementById("messages");
const rtcStatus = document.getElementById("rtc-status");
const oppAvatar = document.getElementById("opp-avatar");
const oppName = document.getElementById("opp-name");
const notifSound = document.querySelector(".send-sound");
const findNewWrap = document.getElementById("find-new-ring-wrap");
const findNewCd = document.getElementById("find-new-cd");
const findNewRingFg = document.getElementById("find-new-ring-fg");

if (them) {
    oppAvatar.src = them.photo || "../images/avatar_1.jpg";
    oppName.textContent = them.name || "Stranger";
}
window.addEventListener("beforeunload", () => {
    if (roomId && socket.connected) socket.emit("leave-dm", { roomId });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    if (t.startsWith("image/")) return "🖼";
    if (t.startsWith("video/")) return "🎬";
    if (t.startsWith("audio/")) return "🎵";
    if (t === "application/pdf") return "📄";
    return "📎";
}

// ── Avatar mode (shares the same localStorage key as chatRoom) ────────────────
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

window.addEventListener("load", () => {
    applyAvatarMode(localStorage.getItem(AVATAR_MODE_KEY));

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
        grid.appendChild(btn);
    });
    if (!document.querySelector("style#_av-active-style")) {
        const s = document.createElement("style");
        s.id = "_av-active-style";
        s.textContent =
            "._av-mode-btn.active{border-color:#111!important;background:#ffe000!important;}";
        document.head.appendChild(s);
    }
    sec.appendChild(grid);
    const bomb = scroll.querySelector(".Bomboclaat-section");
    bomb ? scroll.insertBefore(sec, bomb) : scroll.appendChild(sec);
    applyAvatarMode(localStorage.getItem(AVATAR_MODE_KEY));
});

// ─────────────────────────────────────────────────────────────────────────────
//  COUNTDOWN RING (60s)
// ─────────────────────────────────────────────────────────────────────────────
const RING_CIRC = 2 * Math.PI * 27.2,
    TOTAL_S = 60;
let timeLeft = TOTAL_S,
    cdInterval = null,
    findNewReady = false;
findNewRingFg.style.strokeDasharray = RING_CIRC;
findNewRingFg.style.strokeDashoffset = "0";

function startCountdown() {
    cdInterval = setInterval(() => {
        timeLeft--;
        findNewRingFg.style.strokeDashoffset =
            RING_CIRC * (1 - timeLeft / TOTAL_S);
        findNewCd.innerHTML =
            timeLeft > 0
                ? timeLeft + "s"
                : `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="currentColor" version="1.1"
                        id="Capa_1" width="20px" height="20px" viewBox="0 0 39.499 39.499" xml:space="preserve">
                        <g>
                            <path
                                d="M38.765,26.274c0.469,0.469,0.732,1.104,0.732,1.77s-0.266,1.299-0.732,1.771l-4.344,4.338   c-0.488,0.486-1.127,0.729-1.77,0.729c-0.641,0-1.277-0.243-1.769-0.731c-0.977-0.978-0.975-2.562,0.003-3.535l0.086-0.086   c-1.162,0.131-2.509,0.24-3.81,0.24c-1.576,0-3.07-0.158-4.047-0.629c-2.313-1.109-4.198-3.5-6.021-6.314   c-1.728,2.701-3.488,5.031-5.604,6.234c-0.998,0.567-2.553,0.76-4.188,0.76c-1.855,0-3.816-0.244-5.191-0.461   c-1.364-0.217-2.295-1.496-2.08-2.859c0.216-1.362,1.49-2.291,2.859-2.08c2.532,0.4,5.493,0.521,6.215,0.254   c1.494-0.854,3.354-3.807,5.056-6.601c-1.548-2.506-3.188-4.955-4.595-5.755c-0.698-0.268-3.912-0.141-6.676,0.297   c-1.361,0.211-2.644-0.716-2.859-2.08c-0.215-1.363,0.716-2.645,2.08-2.859c2.748-0.434,7.695-0.974,9.929,0.297   c1.895,1.078,3.504,3.068,5.061,5.411c1.656-2.449,3.389-4.49,5.471-5.491c1.812-0.869,5.449-0.694,7.976-0.435   c-0.614-0.967-0.506-2.263,0.338-3.107c0.976-0.978,2.558-0.978,3.535-0.002l4.347,4.342c0.469,0.469,0.731,1.104,0.731,1.769   s-0.265,1.3-0.731,1.769l-4.345,4.34c-0.487,0.486-1.127,0.73-1.769,0.73c-0.641,0-1.278-0.244-1.768-0.732   c-0.977-0.978-0.975-2.561,0.002-3.535l0.443-0.444c-2.822-0.371-5.871-0.452-6.627-0.171c-1.426,0.687-3.098,3.106-4.686,5.661   c1.746,2.86,3.646,5.784,5.266,6.562c0.619,0.221,3.197,0.153,5.629-0.136l-0.027-0.026c-0.977-0.976-0.979-2.56-0.002-3.533   c0.975-0.98,2.557-0.979,3.535-0.002L38.765,26.274z" />
                        </g>
                    </svg>`;
        if (timeLeft <= 0) {
            clearInterval(cdInterval);
            activateFindNew();
        }
    }, 1000);
}
function activateFindNew() {
    if (findNewReady) return;
    findNewReady = true;
    findNewWrap.classList.add("ready");
    findNewWrap.style.cursor = "pointer";
    findNewRingFg.style.strokeDashoffset = "0";
    findNewCd.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="currentColor" version="1.1"
                        id="Capa_1" width="20px" height="20px" viewBox="0 0 39.499 39.499" xml:space="preserve">
                        <g>
                            <path
                                d="M38.765,26.274c0.469,0.469,0.732,1.104,0.732,1.77s-0.266,1.299-0.732,1.771l-4.344,4.338   c-0.488,0.486-1.127,0.729-1.77,0.729c-0.641,0-1.277-0.243-1.769-0.731c-0.977-0.978-0.975-2.562,0.003-3.535l0.086-0.086   c-1.162,0.131-2.509,0.24-3.81,0.24c-1.576,0-3.07-0.158-4.047-0.629c-2.313-1.109-4.198-3.5-6.021-6.314   c-1.728,2.701-3.488,5.031-5.604,6.234c-0.998,0.567-2.553,0.76-4.188,0.76c-1.855,0-3.816-0.244-5.191-0.461   c-1.364-0.217-2.295-1.496-2.08-2.859c0.216-1.362,1.49-2.291,2.859-2.08c2.532,0.4,5.493,0.521,6.215,0.254   c1.494-0.854,3.354-3.807,5.056-6.601c-1.548-2.506-3.188-4.955-4.595-5.755c-0.698-0.268-3.912-0.141-6.676,0.297   c-1.361,0.211-2.644-0.716-2.859-2.08c-0.215-1.363,0.716-2.645,2.08-2.859c2.748-0.434,7.695-0.974,9.929,0.297   c1.895,1.078,3.504,3.068,5.061,5.411c1.656-2.449,3.389-4.49,5.471-5.491c1.812-0.869,5.449-0.694,7.976-0.435   c-0.614-0.967-0.506-2.263,0.338-3.107c0.976-0.978,2.558-0.978,3.535-0.002l4.347,4.342c0.469,0.469,0.731,1.104,0.731,1.769   s-0.265,1.3-0.731,1.769l-4.345,4.34c-0.487,0.486-1.127,0.73-1.769,0.73c-0.641,0-1.278-0.244-1.768-0.732   c-0.977-0.978-0.975-2.561,0.002-3.535l0.443-0.444c-2.822-0.371-5.871-0.452-6.627-0.171c-1.426,0.687-3.098,3.106-4.686,5.661   c1.746,2.86,3.646,5.784,5.266,6.562c0.619,0.221,3.197,0.153,5.629-0.136l-0.027-0.026c-0.977-0.976-0.979-2.56-0.002-3.533   c0.975-0.98,2.557-0.979,3.535-0.002L38.765,26.274z" />
                        </g>
                    </svg>`;
    findNewWrap.addEventListener("click", doFindNew, { once: true });
}
function activateFindNewNow() {
    if (findNewReady) return;
    clearInterval(cdInterval);
    timeLeft = 0;
    activateFindNew();
}
startCountdown();

// ─────────────────────────────────────────────────────────────────────────────
//  PARTNER LEFT OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
let partnerLeftShown = false;
function showPartnerLeftOverlay() {
    if (partnerLeftShown) return;
    partnerLeftShown = true;
    if (!document.getElementById("_pl-style")) {
        const s = document.createElement("style");
        s.id = "_pl-style";
        s.textContent = `#_pl{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(8px)}._pl-card{display:flex;flex-direction:column;align-items:center;gap:18px;padding:36px 40px 32px;background:#fff;color:#111;border:3px solid #111;box-shadow:8px 8px 0 #111;border-radius:6px;max-width:340px;width:90%;text-align:center}._pl-h{font-size:2rem;font-weight:900;color:#e63329;margin:0;line-height:1}._pl-sub{font-size:.8rem;color:rgba(0,0,0,.5);margin:-8px 0 0}._pl-actions{display:flex;flex-direction:column;gap:10px;width:100%}._pl-btn{width:100%;padding:12px 20px;font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;border-radius:4px;border:2px solid #111}._pl-primary{background:#FFE000;color:#111}._pl-secondary{background:transparent;color:#111}._pl-auto{font-size:.62rem;color:rgba(0,0,0,.35);margin:0}`;
        document.head.appendChild(s);
    }
    const ov = document.createElement("div");
    ov.id = "_pl";
    ov.innerHTML = `<div class="_pl-card"><p class="_pl-h">THEY LEFT</p><p class="_pl-sub">${esc(them?.name || "Your partner")} disconnected.</p><div class="_pl-actions"><button class="_pl-btn _pl-primary" id="_pl-find">🔄 Find New Match</button><button class="_pl-btn _pl-secondary" id="_pl-home">🏠 Go Home</button></div><p class="_pl-auto">Auto-finding in <strong id="_pl-cd">10</strong>s…</p></div>`;
    document.body.appendChild(ov);
    ov.querySelector("#_pl-find").onclick = () => {
        clearInterval(autoId);
        doFindNew();
    };
    ov.querySelector("#_pl-home").onclick = () => {
        clearInterval(autoId);
        localStorage.removeItem("dmRoomId");
        window.location.href = "/";
    };
    let n = 10;
    const cdEl = ov.querySelector("#_pl-cd");
    const autoId = setInterval(() => {
        n--;
        if (cdEl) cdEl.textContent = n;
        if (n <= 0) {
            clearInterval(autoId);
            doFindNew();
        }
    }, 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
//  REACTIONS (P2P data channel, socket relay fallback)
// ─────────────────────────────────────────────────────────────────────────────
const EMOJIS = ["❤️", "😂", "🔥", "😮", "😢", "👍", "💀", "🤙"];
const _myReactions = {},
    _allReactions = {};
let _pickerMsgId = null,
    _pickerTimer = null;

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
            sendDmReaction(msgId, em);
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

function sendDmReaction(msgId, emoji) {
    const cur = _myReactions[msgId],
        newEmoji = emoji === cur ? null : emoji;
    _myReactions[msgId] = newEmoji;
    if (!_allReactions[msgId]) _allReactions[msgId] = {};
    for (const em of Object.keys(_allReactions[msgId])) {
        const arr = _allReactions[msgId][em],
            idx = arr.indexOf(userId);
        if (idx > -1) arr.splice(idx, 1);
        if (!arr.length) delete _allReactions[msgId][em];
    }
    if (newEmoji) {
        if (!_allReactions[msgId][newEmoji])
            _allReactions[msgId][newEmoji] = [];
        _allReactions[msgId][newEmoji].push(userId);
    }
    updateDmReactionBar(msgId, _allReactions[msgId]);
    const payload = JSON.stringify({
        _type: "dm-react",
        msgId,
        emoji,
        reactorId: userId,
    });
    if (rtcReady && dataChannel?.readyState === "open")
        dataChannel.send(payload);
    else
        socket.emit("dm-react-relay", {
            roomId,
            msgId,
            emoji,
            reactorId: userId,
        });
}
function handleIncomingReaction({ msgId, emoji, reactorId }) {
    if (!_allReactions[msgId]) _allReactions[msgId] = {};
    for (const em of Object.keys(_allReactions[msgId])) {
        const arr = _allReactions[msgId][em],
            idx = arr.indexOf(reactorId);
        if (idx > -1) arr.splice(idx, 1);
        if (!arr.length) delete _allReactions[msgId][em];
    }
    if (!_allReactions[msgId][emoji]) _allReactions[msgId][emoji] = [];
    if (!_allReactions[msgId][emoji].includes(reactorId))
        _allReactions[msgId][emoji].push(reactorId);
    updateDmReactionBar(msgId, _allReactions[msgId]);
}
socket.on("dm-react-relay", handleIncomingReaction);

function updateDmReactionBar(msgId, reactionsData) {
    const li = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (!li) return;
    const myEmoji = _myReactions[msgId] || null;
    if (_pickerMsgId === msgId)
        document.querySelectorAll("#_react-picker button").forEach((b) => {
            const own = b.textContent.trim() === myEmoji;
            b.style.outline = own ? "2px solid #ffe000" : "";
            b.style.outlineOffset = own ? "1px" : "";
        });
    let bar = li.querySelector("._reaction-bar");
    if (!bar) {
        bar = document.createElement("div");
        bar.className = "_reaction-bar";
        li.appendChild(bar);
    }
    bar.innerHTML = "";
    for (const [em, voters] of Object.entries(reactionsData || {})) {
        if (!voters.length) continue;
        const isMine = voters.includes(userId);
        const chip = document.createElement("span");
        chip.style.cssText = `display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;cursor:pointer;font-size:.78rem;border:1.5px solid rgba(0,0,0,.15);background:${isMine ? "rgba(255,224,0,.5)" : "rgba(255,255,255,.65)"};margin:2px 2px 0 0;user-select:none;`;
        chip.innerHTML = `${em}<span style="font-size:.65rem;font-weight:700;color:#111;">${voters.length}</span>`;
        chip.addEventListener("click", () => sendDmReaction(msgId, em));
        bar.appendChild(chip);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  RENDER MESSAGES
// ─────────────────────────────────────────────────────────────────────────────
function renderMsg({
    senderId,
    name: msgName,
    message,
    time,
    msgId: mid,
    photo,
}) {
    const isMine = senderId === userId,
        msgId = mid || genMsgId();
    const li = document.createElement("li");
    li.className = isMine ? "my-message" : "other-message";
    li.dataset.senderId = senderId;
    li.dataset.msgId = msgId;
    li.innerHTML = `<span class="meta">${esc(msgName)}<span class="time">${time}</span></span><div>${esc(message)}</div>`;

    // Add avatar image
    const avatarSrc =
        photo || (isMine ? me?.photo : them?.photo) || "../images/avatar_1.jpg";
    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = avatarSrc;
    avatar.alt = esc(msgName);
    avatar.draggable = false;
    li.appendChild(avatar);

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
    messagesEl.appendChild(li);
    scroll();
    notifSound.play().catch(() => {});
    return li;
}

function sysMsg(text) {
    const li = document.createElement("li");
    li.className = "sys-msg";
    li.textContent = text;
    messagesEl.appendChild(li);
    scroll();
}
function scroll() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

// ─────────────────────────────────────────────────────────────────────────────
//  WebRTC
// ─────────────────────────────────────────────────────────────────────────────
const RTC_CFG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};
let pc = null,
    dataChannel = null,
    rtcReady = false,
    fallback = false;
let rtcWatchdog = setTimeout(() => {
    if (!rtcReady) enableFallback();
}, 7000);

function setStatus(s) {
    const L = { connecting: "Connecting…", p2p: "P2P", relay: "Relayed" };
    rtcStatus.className = "rtc-status " + s;
    rtcStatus.textContent = L[s] || s;
}
function enableFallback() {
    fallback = true;
    setStatus("relay");
    document.getElementById("p2p-label").textContent = "Relayed";
}

function createPC() {
    pc = new RTCPeerConnection(RTC_CFG);
    pc.onicecandidate = ({ candidate }) => {
        if (candidate) socket.emit("rtc-ice", { roomId, candidate });
    };
    pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
            clearTimeout(rtcWatchdog);
            rtcReady = true;
            fallback = false;
            setStatus("p2p");
        } else if (
            ["failed", "disconnected", "closed"].includes(pc.connectionState)
        )
            enableFallback();
    };
    pc.ondatachannel = ({ channel }) => attachDC(channel);
}
function attachDC(ch) {
    dataChannel = ch;
    ch.onmessage = ({ data }) => {
        try {
            const m = JSON.parse(data);
            if (m._type === "typing") showTyping(m.name);
            else if (m._type === "stopped-typing") hideTyping();
            else if (m._type === "chat") renderMsg(m);
            else if (m._type === "dm-react") handleIncomingReaction(m);
        } catch {}
    };
    ch.onopen = () => {
        rtcReady = true;
        setStatus("p2p");
    };
    ch.onclose = () => {
        if (!fallback) enableFallback();
    };
}
function startOffer() {
    createPC();
    dataChannel = pc.createDataChannel("chat");
    attachDC(dataChannel);
    pc.createOffer()
        .then((o) => pc.setLocalDescription(o))
        .then(() =>
            socket.emit("rtc-offer", { roomId, offer: pc.localDescription }),
        );
}
socket.on("rtc-offer", ({ offer }) => {
    createPC();
    pc.setRemoteDescription(offer)
        .then(() => pc.createAnswer())
        .then((a) => pc.setLocalDescription(a))
        .then(() =>
            socket.emit("rtc-answer", { roomId, answer: pc.localDescription }),
        );
});
socket.on("rtc-answer", ({ answer }) => pc?.setRemoteDescription(answer));
socket.on("rtc-ice", ({ candidate }) =>
    pc?.addIceCandidate(candidate).catch(() => {}),
);
socket.on("dm-peer-ready", () => {
    if (iAmOfferer && !pc) startOffer();
});

// ─────────────────────────────────────────────────────────────────────────────
//  SEND / RECEIVE MESSAGES
// ─────────────────────────────────────────────────────────────────────────────
function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    const msgId = genMsgId(),
        time = getTime();
    const p = {
        _type: "chat",
        senderId: userId,
        name: fmtName(name),
        message: msg,
        time,
        msgId,
        photo,
    };
    renderMsg(p);
    input.value = "";
    sendTyping(false);
    if (rtcReady && dataChannel?.readyState === "open")
        dataChannel.send(JSON.stringify(p));
    else
        socket.emit("dm-message", {
            roomId,
            message: msg,
            name: fmtName(name),
            time,
            photo,
        });
}
form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
});
document.querySelector(".send")?.addEventListener("click", sendMessage);
socket.on("dm-message", (data) => {
    if (data.senderId !== userId) renderMsg(data);
});

// ─────────────────────────────────────────────────────────────────────────────
//  TYPING
// ─────────────────────────────────────────────────────────────────────────────
let typingTimeout;
input.addEventListener("input", () => {
    sendTyping(true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => sendTyping(false), 1000);
});
function sendTyping(on) {
    const n = fmtName(name);
    if (rtcReady && dataChannel?.readyState === "open")
        dataChannel.send(
            JSON.stringify(
                on ? { _type: "typing", name: n } : { _type: "stopped-typing" },
            ),
        );
    else {
        on
            ? socket.emit("dm-typing", { roomId, name: n })
            : socket.emit("dm-typing-stopped", { roomId });
    }
}
function showTyping(u) {
    if (document.querySelector(".typing-ntf")) return;
    const li = document.createElement("li");
    li.className = "typing-ntf other-message";
    li.style.cssText =
        "display:flex;align-items:center;gap:8px;position:relative;";
    li.innerHTML = `<span class="meta">${esc(u)}</span>`;

    const wrapper = document.createElement("span");
    wrapper.style.cssText = "display:flex;align-items:center;gap:4px;";
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        wrapper.appendChild(dot);
    }
    li.appendChild(wrapper);

    // Add avatar
    const avatarSrc = them?.photo || "../images/avatar_1.jpg";
    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = avatarSrc;
    avatar.alt = esc(u);
    avatar.draggable = false;
    li.appendChild(avatar);

    messagesEl.appendChild(li);
    scroll();
}
function hideTyping() {
    document.querySelector(".typing-ntf")?.remove();
}
socket.on("dm-typing", (n) => showTyping(n));
socket.on("dm-typing-stopped", () => hideTyping());

// ─────────────────────────────────────────────────────────────────────────────
//  AUDIO CONTROLS + RECORDING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format seconds into m:ss format (e.g., 0:04 for 4s, 1:35 for 95s)
 */
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

const recordBtn = document.querySelector(".recordBtn"),
    recordSound = document.querySelector(".recording");
let mediaRecorder,
    audioChunks = [];
const MIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="12" rx="4" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="9" y1="22" x2="15" y2="22"/></g></svg>`;
const STOP_SVG = `<svg width="15" height="15" viewBox="0 0 17 17" xmlns="http://www.w3.org/2000/svg"><circle cx="8.5" cy="8.5" r="8.5" fill="currentColor"/></svg>`;

recordBtn?.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        socket.emit("recording", { roomId, name: fmtName(name) });
        recordBtn.innerHTML = STOP_SVG;
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
            const b = new Blob(audioChunks, { type: "audio/webm" });
            audioChunks = [];
            const r = new FileReader();
            r.readAsDataURL(b);
            r.onloadend = () =>
                socket.emit("send-audio", {
                    roomId,
                    audioData: r.result,
                    senderId: userId,
                    senderName: fmtName(name),
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
    li.className = "recording-ntf other-message";
    li.style.cssText =
        "display:flex;align-items:center;gap:8px;position:relative;";
    li.innerHTML = `<span class="meta">${esc(n)}</span>`;

    const micDiv = document.createElement("div");
    micDiv.innerHTML = MIC_SVG;
    li.appendChild(micDiv);

    // Add avatar
    const avatarSrc = them?.photo || "../images/avatar_1.jpg";
    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = avatarSrc;
    avatar.alt = esc(n);
    avatar.draggable = false;
    li.appendChild(avatar);

    messagesEl.appendChild(li);
    scroll();
    recordSound?.play().catch(() => {});
});
socket.on("send-audio", ({ audioData, senderId: sid, senderName, time }) => {
    document.querySelector(".recording-ntf")?.remove();
    const li = document.createElement("li");
    li.dataset.msgId = "a_" + genMsgId();
    li.dataset.senderId = sid;
    li.className = sid === userId ? "my-message" : "other-message";
    li.innerHTML = `<span class="meta">${esc(senderName)}<span class="time">${time}</span></span>`;

    // Add avatar
    const avatarSrc =
        sid === userId ? photo : them?.photo || "../images/avatar_1.jpg";
    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = avatarSrc;
    avatar.alt = esc(senderName);
    avatar.draggable = false;
    li.appendChild(avatar);

    const au = Object.assign(document.createElement("audio"), {
        id: "targetAudio",
        src: audioData,
    });
    const d = document.createElement("div");
    d.className = "time-range";
    d.innerHTML = `<input type="range" value="0" id="progress"><div id="time" style="white-space:nowrap;font-family:monospace;min-width:40px;text-align:center;font-size:.75rem;font-weight:700;">00:00</div><div id="playSwitchBtn" class="pause">▶</div>`;
    d.appendChild(au);
    li.appendChild(d);
    messagesEl.appendChild(li);
    setAudioControls();
    scroll();
    notifSound.play().catch(() => {});
});

// ─────────────────────────────────────────────────────────────────────────────
//  FILE TRANSFER — LAZY (DM version)
//
//  Same protocol as chatRoom but scoped to the DM roomId.
//  Sender holds the File object. No binary is sent until receiver clicks Download.
//  Server routes the binary directly from sender socket to requester socket.
// ─────────────────────────────────────────────────────────────────────────────
const _pendingFiles = new Map();

function buildFileCard({ msgId, fileName, size, isMine }) {
    const card = document.createElement("div");
    card.dataset.fileCard = msgId;
    card.style.cssText =
        "display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:6px;background:rgba(0,0,0,.06);max-width:320px;margin-top:4px;";

    const ext = fileName?.split(".").pop();
    const icon = document.createElement("span");
    icon.style.cssText = "font-size:1.4rem;flex-shrink:0;";
    icon.textContent = fileIcon(ext ? "." + ext : "");

    const info = document.createElement("div");
    info.style.cssText = "flex:1;min-width:0;";
    info.innerHTML = `<span style="font-size:.78rem;font-weight:700;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(fileName)}">${esc(fileName)}</span><span style="font-size:.62rem;opacity:.5;">${fmtBytes(size)}</span>`;

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
    btn.textContent = "Requesting…";
    btn.style.opacity = ".6";
    btn.style.pointerEvents = "none";
    socket.emit("request-file", { msgId });
}

function setFileCardStatus(msgId, text) {
    const btn = document.querySelector(`[data-file-dl-btn="${msgId}"]`);
    if (btn) {
        btn.textContent = text;
        btn.style.pointerEvents = "none";
        btn.style.opacity = ".5";
    }
}

// Sender: offer metadata, store File
function offerFile(file) {
    if (file.size > 25 * 1024 * 1024) return alert("File too large. Max 25MB.");
    const msgId = "f_" + genMsgId(),
        fName = fmtName(name),
        time = getTime();
    _pendingFiles.set(msgId, file);
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
        }),
    );

    // Add avatar
    const avatar = document.createElement("img");
    avatar.className = "msg-avatar";
    avatar.src = photo || "../images/avatar_1.jpg";
    avatar.alt = esc(fName);
    avatar.draggable = false;
    li.appendChild(avatar);

    messagesEl.appendChild(li);
    scroll();
    socket.emit("file-offer", {
        roomId,
        msgId,
        name: file.name,
        size: file.size,
        type: file.type,
    });
}

document.getElementById("dm-file-btn")?.addEventListener("click", () => {
    const fi = document.querySelector("#send-file");
    fi.click();
    fi.onchange = (e) => {
        if (e.target.files.length > 0) offerFile(e.target.files[0]);
        fi.value = "";
    };
});

// Receiver: sees card
socket.on(
    "file-offer",
    ({ msgId, senderName, senderId, name: fileName, size, time }) => {
        const li = document.createElement("li");
        li.dataset.msgId = msgId;
        li.dataset.senderId = senderId;
        li.dataset.senderName = senderName;
        li.className = "other-message";
        li.innerHTML = `<span class="meta">${esc(senderName)}<span class="time">${time}</span></span>`;
        li.appendChild(buildFileCard({ msgId, fileName, size, isMine: false }));

        // Add avatar
        const avatar = document.createElement("img");
        avatar.className = "msg-avatar";
        avatar.src = them?.photo || "../images/avatar_1.jpg";
        avatar.alt = esc(senderName);
        avatar.draggable = false;
        li.appendChild(avatar);

        messagesEl.appendChild(li);
        scroll();
        notifSound.play().catch(() => {});
    },
);

// Server tells sender to deliver to a specific socket
socket.on("deliver-file-now", ({ msgId, requesterSocketId }) => {
    const file = _pendingFiles.get(msgId);
    if (!file) return;
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () =>
        socket.emit("file-delivery", {
            msgId,
            requesterSocketId,
            data: reader.result,
            type: file.type,
        });
});

// Receiver gets binary, browser displays inline
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
        });
    }

    // Remove the file card
    const fileCard = li.querySelector("[data-file-card]");
    if (fileCard) fileCard.remove();

    li.appendChild(element);

    li.className = senderId === userId ? "my-message" : "other-message";
    scroll();
    notifSound.play().catch(() => {});
    if (type.startsWith("audio/")) setAudioControls();
});

socket.on("file-unavailable", ({ msgId }) => {
    setFileCardStatus(msgId, "Unavailable");
    if (_pendingFiles.has(msgId)) _pendingFiles.delete(msgId);
});

// ─────────────────────────────────────────────────────────────────────────────
//  PARTNER LEFT / FIND NEW
// ─────────────────────────────────────────────────────────────────────────────
socket.on("partner-left", () => {
    sysMsg(`${them?.name || "Your partner"} left.`);
    activateFindNewNow();
    showPartnerLeftOverlay();
});
socket.on("user_disconnect", (n) => {
    sysMsg(`${n} disconnected`);
    activateFindNewNow();
    showPartnerLeftOverlay();
});

function doFindNew() {
    socket.emit("leave-dm", { roomId });
    dataChannel?.close();
    pc?.close();
    pc = null;
    localStorage.removeItem("dmRoomId");
    window.location.href = "/matching";
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONNECT
// ─────────────────────────────────────────────────────────────────────────────
socket.on("connect", () => {
    socket.emit("join-room", { roomId, name: fmtName(name), photo });
    socket.emit("dm-peer-ready", { roomId });
    if (iAmOfferer && !pc)
        setTimeout(() => {
            if (!pc) startOffer();
        }, 800);
});
