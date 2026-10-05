import express from "express";
import { prisma, databaseConfigSummary } from "db/client";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware.js";
import cors from "cors";
import bcrypt from "bcryptjs";

const app = express();

// Configure CORS with specific options
app.use(
  cors({
    origin: true, // Allow any origin
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "username and password are required" });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ message: "Username already taken" });
    return;
  }
  const user = await prisma.user.create({
    data: { username, password: await bcrypt.hash(password, 10) },
  });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
  res.json({ token, username: user.username });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = username ? await prisma.user.findUnique({ where: { username } }) : null;
  if (!user || !(await bcrypt.compare(password ?? "", user.password))) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
  res.json({ token , username: user.username });
});

app.post("/create-room", authMiddleware, async (req, res) => {
  //@ts-ignore
  const userId = req?.userId;
  const { name } = req.body;
  const room = await prisma.room.create({
    data: {
      name: name,
      adminId: userId,
    },
  });
  res.status(201).json(room);
});

// Then modify the join-room endpoint
app.post("/join-room/:id", authMiddleware, async (req, res) => {
  console.log("Join room endpoint hit with params:", req.params);
  //@ts-ignore
  const userId = req?.userId;
  const { id } = req.params;
  
  try {
    console.log("Looking for room with ID:", id);
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id },
    });
    
    console.log("Found room:", room);
    
    if (!room) {
     res.status(404).json({ message: "Room not found" });
    }
    
    // In a real app, you might want to add the user to room members here
    // For now, we'll just return the room details
    
    res.json(room);
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ message: "Error joining room" });
  }
});

// Add endpoint to get user's rooms
app.get("/my-rooms", authMiddleware, async (req, res) => {
  //@ts-ignore
  const userId = req?.userId;

  try {
    const rooms = await prisma.room.findMany({
      where: {
        adminId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Error fetching rooms" });
  }
});

app.get("/", (req, res) => {
  res.send("AIDraw API is running");
});

app.get("/health", async (req, res) => {
  const db = databaseConfigSummary();
  let reachable = false;
  if (db.validProtocol) {
    try { await prisma.$queryRaw`SELECT 1`; reachable = true; } catch { reachable = false; }
  }
  res.json({ ok: true, db: { ...db, reachable } });
});

// JSON error handler so clients and logs see the real failure instead of an empty 500
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Unhandled error:", message);
  res.status(500).json({ message: "Internal error", detail: message.slice(0, 300) });
});

const PORT = Number(process.env.PORT) || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
