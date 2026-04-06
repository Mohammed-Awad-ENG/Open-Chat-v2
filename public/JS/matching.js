// ── Identity ──────────────────────────────────────────────────────────────────
let userId = localStorage.getItem("userId");
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userId", userId);
}

const name = localStorage.getItem("userName");
const photo = localStorage.getItem("avatar");
const chatMode = localStorage.getItem("chatMode"); // 'dm' | 'rooms'
const skipList = JSON.parse(localStorage.getItem("skipList") || "[]");

if (!name) {
    window.location.href = "/";
}

const socket = io({ auth: { userId } });

// ── UI refs ───────────────────────────────────────────────────────────────────
const myAvatarImg = document.getElementById("my-avatar-img");
const searchModeLabel = document.getElementById("search-mode-label");
const cancelBtn = document.getElementById("cancel-btn");
const searchingEl = document.getElementById("searching");
const vsScreen = document.getElementById("vs-screen");
const roomFoundEl = document.getElementById("room-found");
const vsCountdown = document.getElementById("vs-countdown");
const cdNum = document.getElementById("cd-num");
const vsCanvas = document.getElementById("vs-canvas");
const ctx = vsCanvas.getContext("2d");

if (photo) myAvatarImg.src = photo;

searchModeLabel.textContent =
    chatMode === "dm"
        ? "Looking for your 1v1 opponent…"
        : "Finding you a room…";

// ── Start search ──────────────────────────────────────────────────────────────
function startSearch() {
    if (chatMode === "dm") {
        socket.emit("find-dm", { userId, name, photo, skipList });
    } else {
        socket.emit("find-room", { userId, name, photo });
    }
}

socket.on("connect", startSearch);

cancelBtn.addEventListener("click", () => {
    socket.emit("cancel-find-dm");
    window.location.href = "/";
});

// ── DM match → VS animation ───────────────────────────────────────────────────
socket.on("dm-matched", ({ roomId, users, offerer }) => {
    const me = users.find((u) => u.userId === userId);
    const them = users.find((u) => u.userId !== userId);

    localStorage.setItem("dmRoomId", roomId);
    localStorage.setItem("dmOfferer", offerer);
    localStorage.setItem("dmUsers", JSON.stringify(users));
    localStorage.setItem("lastPartnerId", them?.userId || "");
    localStorage.setItem(
        "skipList",
        JSON.stringify([them?.userId].filter(Boolean)),
    );

    runVsAnimation(me, them, () => {
        window.location.href = "/dm";
    });
});

// ── Room match → brief found screen ──────────────────────────────────────────
socket.on("room-matched", ({ roomId }) => {
    localStorage.setItem("roomCode", roomId);
    runRoomFoundAnimation(() => {
        window.location.href = "/chatRoom";
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// CANVAS LIGHTNING ENGINE
// ═════════════════════════════════════════════════════════════════════════════

let lightningActive = false;
let showCenterBolt = false;
let rafId = null;

// Recursive jagged lightning segment
function drawSegment(x1, y1, x2, y2, width, color, depth) {
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(width, 0.4);
    ctx.lineCap = "round";

    if (depth === 0) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
        return;
    }

    const dx = x2 - x1,
        dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * len * 0.45;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * len * 0.45;

    drawSegment(x1, y1, mx, my, width * 0.75, color, depth - 1);
    drawSegment(mx, my, x2, y2, width * 0.75, color, depth - 1);

    // Random branch
    if (depth > 1 && Math.random() > 0.55) {
        const bLen = len * (0.2 + Math.random() * 0.35);
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
        drawSegment(
            mx,
            my,
            mx + Math.cos(angle) * bLen,
            my + Math.sin(angle) * bLen,
            width * 0.45,
            color,
            depth - 2,
        );
    }
    ctx.restore();
}

// Draw an electric "living" ring around a centre point
function drawElectricRing(cx, cy, r, color, glowColor) {
    const pts = 36;
    const points = [];

    for (let i = 0; i <= pts; i++) {
        const angle = (i / pts) * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * r * 0.22;
        const rad = r + jitter;
        points.push({
            x: cx + Math.cos(angle) * rad,
            y: cy + Math.sin(angle) * rad,
        });
    }

    // Glow layer
    ctx.save();
    ctx.shadowBlur = 28;
    ctx.shadowColor = glowColor;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++)
        ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Main electric line
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++)
        ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Random sparks flying outward
    const numSparks = 2 + Math.floor(Math.random() * 3);
    for (let s = 0; s < numSparks; s++) {
        const idx = Math.floor(Math.random() * points.length);
        const p = points[idx];
        const ang = Math.atan2(p.y - cy, p.x - cx);
        const sLen = 12 + Math.random() * 28;
        const sx = p.x + Math.cos(ang) * sLen + (Math.random() - 0.5) * 8;
        const sy = p.y + Math.sin(ang) * sLen + (Math.random() - 0.5) * 8;
        drawSegment(p.x, p.y, sx, sy, 1.2, color, 2);
    }
}

// Draw dramatic center lightning bolt connecting both fighters
function drawCenterBolt(x1, y1, x2, y2) {
    // Outer thick white bolt
    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = "#ffffff";
    ctx.globalAlpha = 0.7;
    drawSegment(x1, y1, x2, y2, 3, "#ffffff", 5);
    ctx.restore();

    // Inner yellow bolt
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawSegment(x1, y1, x2, y2, 1.5, "#FFE000", 4);
    ctx.restore();
}

// Main animation loop
function animateElectric() {
    if (!lightningActive) return;

    // Resize canvas to match display size
    vsCanvas.width = vsCanvas.offsetWidth;
    vsCanvas.height = vsCanvas.offsetHeight;
    ctx.clearRect(0, 0, vsCanvas.width, vsCanvas.height);

    const canvasRect = vsCanvas.getBoundingClientRect();

    const lr = document.getElementById("left-ring").getBoundingClientRect();
    const rr = document.getElementById("right-ring").getBoundingClientRect();

    const lCx = lr.left + lr.width / 2 - canvasRect.left;
    const lCy = lr.top + lr.height / 2 - canvasRect.top;
    const lR = lr.width / 2 + 10;

    const rCx = rr.left + rr.width / 2 - canvasRect.left;
    const rCy = rr.top + rr.height / 2 - canvasRect.top;
    const rR = rr.width / 2 + 10;

    drawElectricRing(lCx, lCy, lR, "#FFE000", "#FFE000");
    drawElectricRing(rCx, rCy, rR, "#e63329", "#ff4444");

    if (showCenterBolt && Math.random() > 0.35) {
        const lEdgeX = lCx + lR;
        const rEdgeX = rCx - rR;
        const midY = (lCy + rCy) / 2;
        drawCenterBolt(lEdgeX, midY, rEdgeX, midY);
    }

    rafId = requestAnimationFrame(animateElectric);
}

function stopElectric() {
    lightningActive = false;
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    ctx.clearRect(0, 0, vsCanvas.width, vsCanvas.height);
}

// ═════════════════════════════════════════════════════════════════════════════
//  VS ANIMATION SEQUENCE
// ═════════════════════════════════════════════════════════════════════════════
function flash() {
    const div = document.createElement("div");
    div.className = "flash-overlay";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 500);
}

function hideSearching() {
    searchingEl.style.transition = "opacity .3s";
    searchingEl.style.opacity = "0";
    setTimeout(() => {
        searchingEl.style.display = "none";
    }, 300);
}

function runVsAnimation(me, them, onDone) {
    hideSearching();

    document.getElementById("left-avatar").src =
        me?.photo || "../images/avatar_1.jpg";
    document.getElementById("right-avatar").src =
        them?.photo || "../images/avatar_1.jpg";
    document.getElementById("left-name").textContent = (
        me?.name || "YOU"
    ).toUpperCase();
    document.getElementById("right-name").textContent = (
        them?.name || "???"
    ).toUpperCase();

    vsScreen.classList.add("show");

    const fLeft = document.getElementById("fighter-left");
    const fRight = document.getElementById("fighter-right");
    const lName = document.getElementById("left-name");
    const rName = document.getElementById("right-name");
    const lTag = document.getElementById("left-tag");
    const rTag = document.getElementById("right-tag");
    const vsWord = document.getElementById("vs-word");
    const vsSub = document.getElementById("vs-sub");
    const elecL = document.getElementById("elec-svg-left");
    const elecR = document.getElementById("elec-svg-right");

    at(80, () => {
        fLeft.classList.add("enter");
        fRight.classList.add("enter");
    });
    at(400, () => {
        // Start electric border on avatars
        elecL.classList.add("active");
        elecR.classList.add("active");
        lightningActive = true;
        animateElectric();
    });
    at(560, () => {
        lName.classList.add("show");
        rName.classList.add("show");
    });
    at(700, () => {
        lTag.classList.add("show");
        rTag.classList.add("show");
    });
    at(900, () => {
        flash();
        vsWord.classList.add("pop");
        showCenterBolt = true; // enable center lightning bolt
    });
    at(1300, () => {
        vsSub.classList.add("show");
    });
    at(1600, () => {
        vsCountdown.style.display = "block";
        let n = 3;
        const tick = setInterval(() => {
            n--;
            cdNum.textContent = n;
            if (n <= 0) {
                clearInterval(tick);
                stopElectric();
                onDone();
            }
        }, 1000);
    });
}

// ═════════════════════════════════════════════════════════════════════════════
//  ROOM FOUND ANIMATION
// ═════════════════════════════════════════════════════════════════════════════
function runRoomFoundAnimation(onDone) {
    hideSearching();
    roomFoundEl.classList.add("show");

    const sub = document.getElementById("room-found-sub");
    let n = 3;
    sub.textContent = `Entering in ${n}…`;

    const tick = setInterval(() => {
        n--;
        sub.textContent = n > 0 ? `Entering in ${n}…` : "Entering…";
        if (n <= 0) {
            clearInterval(tick);
            onDone();
        }
    }, 1000);
}

function at(ms, fn) {
    setTimeout(fn, ms);
}
