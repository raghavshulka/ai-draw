import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "db/client";

import { createServer } from "http";

const PORT = Number(process.env.PORT) || 8080;
// Plain HTTP server underneath so hosting health checks and humans get a useful answer on GET /health.
const httpServer = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "aidraw-ws", commit: process.env.RENDER_GIT_COMMIT ?? null }));
    return;
  }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ server: httpServer });
httpServer.listen(PORT, () => console.log(`WebSocket server listening on ${PORT}`));

interface User {
  ws: WebSocket;
  rooms: string[];
  id: string;
  userName?: string;
}
const users: User[] = [];

// Send a policy-violation close and then drop the TCP connection without waiting for the
// client's close frame; some proxies delay the handshake by 20+ seconds otherwise.
function rejectSocket(ws: WebSocket) {
  try { ws.close(1008, "invalid token"); } catch {}
  setTimeout(() => { try { ws.terminate(); } catch {} }, 250);
}

wss.on("connection", function connection(ws, req) {
  const params = req.url;
  const url = new URLSearchParams(params?.split("?")[1]);
  const token = url.get("token");

  if (!token) {
    rejectSocket(ws);
    return;
  }

  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
  } catch {
    rejectSocket(ws);
    return;
  }
  if (!decoded || typeof decoded === "string") {
    rejectSocket(ws);
    return;
  }

  users.push({ ws, id: decoded.id, rooms: [] });

  ws.on("message", async function message(data) {
    let roomData: any;
    try {
      roomData = JSON.parse(data.toString());
    } catch {
      return;
    }
    
    if (roomData.type === "join") {
      const user = users.find((x) => x.ws === ws);
      if (user) {
        user?.rooms.push(roomData.room);
        user.userName = roomData.userName;
      }
    }

    if (roomData.type === "leave") {
      const user = users.find((x) => x.ws === ws);
      if (user) {
        user.rooms = user?.rooms.filter((x) => x !== roomData.room);
      }
    }

    if (roomData.type === "chat") {
      const roomid = roomData.roomId;
      const messages = roomData.messages;
      const senderId = roomData.userId;
      const senderName = roomData.userName;

      await prisma.message.create({
        data: {
          message: messages,
          roomId: roomid,
          userId: decoded.id,
        },
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomid)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              roomId: roomid,
              message: messages,
              senderId: senderId,
              senderName: senderName,
            })
          );
        }
      });
    }

    if (roomData.type === "drawing") {
      const roomid = roomData.roomId;
      const drawingData = {
        type: "drawing",
        from: roomData.from,
        to: roomData.to,
        color: roomData.color,
        lineWidth: roomData.lineWidth,
        userId: roomData.userId,
        userName: roomData.userName,
      };

      users.forEach((user) => {
        if (user.rooms.includes(roomid) && user.id !== roomData.userId) {
          user.ws.send(JSON.stringify(drawingData));
        }
      });
    }

    if (roomData.type === "clear_canvas") {
      const roomid = roomData.roomId;
      const clearData = {
        type: "clear_canvas",
        roomId: roomid,
        userId: roomData.userId,
      };

      users.forEach((user) => {
        if (user.rooms.includes(roomid) && user.id !== roomData.userId) {
          user.ws.send(JSON.stringify(clearData));
        }
      });
    }
  });

  ws.on("close", () => {
    const index = users.findIndex((x) => x.ws === ws);
    if (index !== -1) {
      users.splice(index, 1);
    }
  });
});

process.on("uncaughtException", (err) => console.error("uncaughtException", err));
process.on("unhandledRejection", (err) => console.error("unhandledRejection", err));
