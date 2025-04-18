import express from "express";
import { prisma } from "db/client";
import jwt from "jsonwebtoken";
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

//@ts-ignore
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username, password } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
  res.json({ token });
});

// app.post("/create-room", async (req, res) => {
//   const { name } = req.body;
//   const user = await prismaClient.user.findUnique({ where: { username, password } });
//   if (!user) return res.status(401).json({ message: "Invalid credentials" });
//   const room = await prismaClient.room.create( {
//     data: {
//       name,
//       adminId: user.id,
//     },
//   });
//   res.json(room);
// });

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3002, () => {
  console.log("Server is running on port 3002");
});
