import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  id: string;
  userName?: string;
}
const users: User[] = [];

wss.on("connection", function connection(ws, req) {
  const params = req.url;
  const url = new URLSearchParams(params?.split("?")[1]);
  const token = url.get("token");

  if (!token) {
    ws.close();
    return;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
  if (!decoded) {
    ws.close();
    return;
  }

  if (typeof decoded === "string") {
    return;
  }

  users.push({ ws, id: decoded.id, rooms: [] });

  ws.on("message", async function message(data) {
    const roomData = JSON.parse(data.toString());
    
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
