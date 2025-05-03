import express from "express";
import { prisma } from "db/client";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware.js";
import cors from "cors";

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
  const user = await prisma.user.create({
    data: { username, password },
  });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
  res.json({ token });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username, password } });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
  res.json({ token });
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
  res.send("Hello World");
});

app.listen(3002, () => {
  console.log("Server is running on port 3002");
});
