import express from "express";
import { prisma } from "db/client";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware.js";

const app = express();

app.use(express.json());

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
  res.json(room).status(201);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3002, () => {
  console.log("Server is running on port 3002");
});
