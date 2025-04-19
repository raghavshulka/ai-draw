import { NextFunction, Request, Response   } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    if (!decoded) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    //@ts-ignore
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
