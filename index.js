const express = require("express");
const app = express();
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
const { join } = require("path");
const { randomUUID } = require("crypto");
const server = http.createServer(app);

// maxHttpBufferSize covers the file-delivery event (binary still routed through server)
const io = new Server(server, { maxHttpBufferSize: 25 * 1024 * 1024 });

app.use(cors());

// ── Config ────────────────────────────────────────────────────────────────────
const MAX_ROOM_SIZE = 12;
const KICK_VOTE_TTL = 30_000;
const KICK_THRESHOLD = 0.51;

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (_, res) =>
    res.sendFile(join(__dirname, "public", "Pages", "join.html")),
);
app.get("/chatRoom", (_, res) =>
    res.sendFile(join(__dirname, "public", "Pages", "index.html"), (e) => {
        if (e) res.status(500).send(e);
    }),
);
app.get("/matching", (_, res) =>
    res.sendFile(join(__dirname, "public", "Pages", "matching.html")),
);
app.get("/dm", (_, res) =>
    res.sendFile(join(__dirname, "public", "Pages", "dm.html")),
);
// app.get("/test", (_, res) =>
//     res.sendFile(join(__dirname, "public", "pages", "Neo_brutalism.html")),
// );
app.use(express.static(join(__dirname, "public")));
app.use((_, res) =>
    res
        .status(404)
        .sendFile(join(__dirname, "public", "Pages", "lost_404.html")),
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTime() {
    const now = new Date();
    let h = now.getHours(),
        m = now.getMinutes();
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m < 10 ? "0" + m : m} ${ap}`;
}
function fmt(n) {
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : "User";
}

// ── State ─────────────────────────────────────────────────────────────────────
const rooms = {};
const dmQueue = new Map();
const openRooms = new Map();
const reactions = {}; // reactions[roomId][msgId] = Map<userId, emoji>
const kickVotes = {};

const fileOffers = {};

// ── Room helpers ──────────────────────────────────────────────────────────────
function getOrCreatePublicRoom() {
    let best = null,
        bestCount = -1;
    for (const [rid, cnt] of openRooms) {
        if (cnt >= MAX_ROOM_SIZE || !rooms[rid]) continue;
        if (cnt > bestCount) {
            best = rid;
            bestCount = cnt;
        }
    }
    if (!best) {
        best = "pub_" + randomUUID().slice(0, 8);
        openRooms.set(best, 0);
    }
    return best;
}

function destroyRoom(id) {
    delete rooms[id];
    delete reactions[id];
    delete kickVotes[id];
    openRooms.delete(id);
}

function broadcastMeta(roomId) {
    if (!rooms[roomId]) return;
    io.to(roomId).emit("room-users", [...rooms[roomId].values()]);
    io.to(roomId).emit("room-info", {
        memberCount: rooms[roomId].size,
        maxSize: MAX_ROOM_SIZE,
    });
}

// ── DM Matchmaking ────────────────────────────────────────────────────────────
function tryMatchDm(socket, { userId, name, photo, skipList = [] }) {
    for (const [sid, peer] of dmQueue) {
        if (peer.userId === userId || skipList.includes(peer.userId)) continue;
        const ps = io.sockets.sockets.get(sid);
        if (!ps) {
            dmQueue.delete(sid);
            continue;
        }
        dmQueue.delete(sid);
        const roomId = "dm_" + randomUUID();
        ps.join(roomId);
        socket.join(roomId);
        io.to(roomId).emit("dm-matched", {
            roomId,
            offerer: peer.userId,
            users: [
                {
                    userId: peer.userId,
                    name: peer.name,
                    photo: peer.photo || null,
                },
                { userId, name, photo: photo || null },
            ],
        });
        return;
    }
    dmQueue.set(socket.id, { userId, name, photo, skipList });
    socket.emit("dm-waiting");
}

// ── Socket ────────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
    socket.userId = socket.handshake.auth.userId;

    // ── Join room ─────────────────────────────────────────────────────────────
    socket.on("join-room", ({ roomId, name, photo }) => {
        name = fmt(name);
        if (roomId.startsWith("pub_")) {
            const current = rooms[roomId]?.size ?? 0;
            if (current >= MAX_ROOM_SIZE) {
                socket.emit("room-full", { roomId, maxSize: MAX_ROOM_SIZE });
                return;
            }
        }
        socket.join(roomId);
        socket.roomId = roomId;
        socket.name = name;
        socket.chatJoined = true;
        if (!rooms[roomId]) rooms[roomId] = new Map();
        const alreadyInRoom = rooms[roomId].has(socket.userId);
        rooms[roomId].set(socket.userId, { name, photo: photo || null });
        if (roomId.startsWith("pub_"))
            openRooms.set(roomId, rooms[roomId].size);
        if (!alreadyInRoom) socket.to(roomId).emit("join_msg", name);
        broadcastMeta(roomId);
    });

    // ── DM ────────────────────────────────────────────────────────────────────
    socket.on("find-dm", (data) => tryMatchDm(socket, data));
    socket.on("cancel-find-dm", () => dmQueue.delete(socket.id));
    socket.on("leave-dm", ({ roomId }) => {
        socket.leave(roomId);
        socket.to(roomId).emit("partner-left");
    });
    socket.on("dm-peer-ready", ({ roomId }) =>
        socket.to(roomId).emit("dm-peer-ready"),
    );

    // ── Public room ───────────────────────────────────────────────────────────
    socket.on("find-room", ({ userId, name, photo }) => {
        name = fmt(name);
        const roomId = getOrCreatePublicRoom();
        socket.join(roomId);
        socket.roomId = roomId;
        socket.name = name;
        socket.userId = userId;
        socket.chatJoined = false;
        if (!rooms[roomId]) rooms[roomId] = new Map();
        rooms[roomId].set(userId, { name, photo: photo || null });
        openRooms.set(roomId, rooms[roomId].size);
        socket.emit("room-matched", {
            roomId,
            memberCount: rooms[roomId].size,
            maxSize: MAX_ROOM_SIZE,
        });
    });

    // ── Voluntary leave ───────────────────────────────────────────────────────
    socket.on("leave-room", ({ roomId }) => {
        if (!roomId) return;
        socket.leave(roomId);
        if (rooms[roomId]) {
            rooms[roomId].delete(socket.userId);
            if (rooms[roomId].size === 0) {
                destroyRoom(roomId);
            } else {
                openRooms.set(roomId, rooms[roomId].size);
                socket
                    .to(roomId)
                    .emit("user_disconnect", socket.name || "Someone");
                broadcastMeta(roomId);
            }
        }
        if (socket.roomId === roomId) {
            socket.roomId = null;
            socket.name = null;
        }
    });

    // ── Chat message ──────────────────────────────────────────────────────────
    socket.on("chat message", ({ roomId, message, name, msgId }) => {
        if (!message || message.length > 600) return;
        const user = rooms[roomId]?.get(socket.userId) || {};
        io.to(roomId).emit("send_to_all_and_save", {
            name: fmt(name),
            message,
            time: getTime(),
            senderId: socket.userId,
            msgId,
            photo: user.photo || null,
        });
    });

    // ── Reactions ─────────────────────────────────────────────────────────────
    socket.on("react", ({ roomId, msgId, emoji }) => {
        if (!roomId || !msgId || !emoji) return;
        if (!reactions[roomId]) reactions[roomId] = {};
        if (!reactions[roomId][msgId]) reactions[roomId][msgId] = new Map();
        const msgMap = reactions[roomId][msgId];
        const uid = socket.userId;
        const cur = msgMap.get(uid);
        cur === emoji ? msgMap.delete(uid) : msgMap.set(uid, emoji);
        const full = {};
        for (const [u, em] of msgMap) {
            if (!full[em]) full[em] = [];
            full[em].push(u);
        }
        io.to(roomId).emit("reaction-update", { msgId, reactions: full });
    });

    // ── Kick voting ───────────────────────────────────────────────────────────
    socket.on("vote-kick", ({ roomId, targetUserId }) => {
        if (!roomId || !targetUserId || socket.userId === targetUserId) return;
        if (!rooms[roomId]?.has(targetUserId)) return;
        if (!kickVotes[roomId]) kickVotes[roomId] = {};
        if (!kickVotes[roomId][targetUserId])
            kickVotes[roomId][targetUserId] = {
                voters: new Set(),
                timer: null,
            };
        const kv = kickVotes[roomId][targetUserId];
        if (kv.voters.has(socket.userId)) return;
        kv.voters.add(socket.userId);
        const roomSize = rooms[roomId].size;
        const needed = Math.ceil(roomSize * KICK_THRESHOLD);
        const voteCount = kv.voters.size;
        const targetName = rooms[roomId].get(targetUserId)?.name || "Someone";
        io.to(roomId).emit("kick-vote-update", {
            targetUserId,
            targetName,
            voteCount,
            needed,
        });
        if (voteCount >= needed) {
            clearTimeout(kv.timer);
            delete kickVotes[roomId][targetUserId];
            for (const [, sock] of io.sockets.sockets) {
                if (sock.userId === targetUserId) {
                    sock.leave(roomId);
                    sock.emit("you-were-kicked", { roomId });
                    if (rooms[roomId]) {
                        rooms[roomId].delete(targetUserId);
                        rooms[roomId].size === 0
                            ? destroyRoom(roomId)
                            : (openRooms.set(roomId, rooms[roomId].size),
                              broadcastMeta(roomId));
                    }
                    break;
                }
            }
            io.to(roomId).emit("user-kicked", { targetUserId, targetName });
        } else {
            clearTimeout(kv.timer);
            kv.timer = setTimeout(() => {
                delete kickVotes[roomId]?.[targetUserId];
                io.to(roomId).emit("kick-vote-expired", { targetUserId });
            }, KICK_VOTE_TTL);
        }
    });

    // ── DM relay ──────────────────────────────────────────────────────────────
    socket.on("dm-message", ({ roomId, message, name, time }) => {
        if (!message || message.length > 600) return;
        socket.to(roomId).emit("dm-message", {
            message,
            name: fmt(name),
            time,
            senderId: socket.userId,
        });
    });
    socket.on("dm-typing", ({ roomId, name }) =>
        socket.to(roomId).emit("dm-typing", fmt(name)),
    );
    socket.on("dm-typing-stopped", ({ roomId }) =>
        socket.to(roomId).emit("dm-typing-stopped"),
    );
    socket.on("dm-react-relay", ({ roomId, ...data }) =>
        socket.to(roomId).emit("dm-react-relay", data),
    );

    // ── Audio ─────────────────────────────────────────────────────────────────
    socket.on("send-audio", ({ roomId, audioData, senderId, senderName }) =>
        io.to(roomId).emit("send-audio", {
            audioData,
            senderId,
            senderName: fmt(senderName),
            time: getTime(),
        }),
    );

    // ── Typing ────────────────────────────────────────────────────────────────
    socket.on("typing", ({ roomId, name }) =>
        socket.to(roomId).emit("show-typing-stats", fmt(name)),
    );
    socket.on("recording", ({ roomId, name }) =>
        socket.to(roomId).emit("show-recording-ntf", fmt(name)),
    );
    socket.on("typing-stopped", ({ roomId }) =>
        socket.to(roomId).emit("user-stopped-typing"),
    );

    socket.on("file-offer", ({ roomId, msgId, name: fileName, size, type }) => {
        if (!msgId || !fileName) return;

        // Store metadata only
        fileOffers[msgId] = {
            socketId: socket.id,
            senderName: fmt(socket.name || name),
            senderId: socket.userId,
            name: fileName,
            size,
            type,
            time: getTime(),
            roomId,
        };

        // Broadcast metadata to everyone else in the room
        socket.to(roomId).emit("file-offer", {
            msgId,
            senderName: fmt(socket.name || name),
            senderId: socket.userId,
            name: fileName,
            size,
            type,
            time: fileOffers[msgId].time,
        });
    });

    socket.on("request-file", ({ msgId }) => {
        const offer = fileOffers[msgId];
        if (!offer) {
            // Offer expired (sender disconnected)
            socket.emit("file-unavailable", { msgId });
            return;
        }
        const senderSock = io.sockets.sockets.get(offer.socketId);
        if (!senderSock) {
            socket.emit("file-unavailable", { msgId });
            delete fileOffers[msgId];
            return;
        }
        // Tell sender to push the file binary to this specific requester
        senderSock.emit("deliver-file-now", {
            msgId,
            requesterSocketId: socket.id,
        });
    });

    socket.on("file-delivery", ({ msgId, requesterSocketId, data, type }) => {
        // Validate this socket is the original offerer
        const offer = fileOffers[msgId];
        if (!offer || offer.socketId !== socket.id) return;

        const requester = io.sockets.sockets.get(requesterSocketId);
        if (requester) {
            requester.emit("file-received", {
                msgId,
                data,
                type,
                name: offer.name,
            });
        }
        // Keep the offer alive in case other room members also want the file.
        // It is cleaned up when the sender disconnects.
    });

    // ── WebRTC ────────────────────────────────────────────────────────────────
    socket.on("rtc-offer", ({ roomId, offer }) =>
        socket.to(roomId).emit("rtc-offer", { offer }),
    );
    socket.on("rtc-answer", ({ roomId, answer }) =>
        socket.to(roomId).emit("rtc-answer", { answer }),
    );
    socket.on("rtc-ice", ({ roomId, candidate }) =>
        socket.to(roomId).emit("rtc-ice", { candidate }),
    );

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
        dmQueue.delete(socket.id);

        // Clean up any file offers this socket was hosting
        for (const [msgId, offer] of Object.entries(fileOffers)) {
            if (offer.socketId === socket.id) {
                delete fileOffers[msgId];
                // Notify the room the file is no longer available
                if (offer.roomId) {
                    io.to(offer.roomId).emit("file-unavailable", { msgId });
                }
            }
        }

        if (socket.roomId && socket.name) {
            if (socket.chatJoined) {
                socket.to(socket.roomId).emit("user_disconnect", socket.name);
                if (socket.roomId.startsWith("dm_"))
                    socket.to(socket.roomId).emit("partner-left");
            }
            if (rooms[socket.roomId]) {
                rooms[socket.roomId].delete(socket.userId);
                rooms[socket.roomId].size === 0
                    ? destroyRoom(socket.roomId)
                    : (openRooms.set(socket.roomId, rooms[socket.roomId].size),
                      broadcastMeta(socket.roomId));
            }
        }
    });
});

const port = 3000;
server.listen(port, () =>
    console.log(`app listening on http://localhost:${port}`),
);
// cloudflared tunnel --url http://localhost:3000
