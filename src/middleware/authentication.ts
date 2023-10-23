import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const checkUserRole = (role) => {
  return (req: Request, res: Response next: NextFunction) => {
    try {
      const token = req.cookies.access_token;
      const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);

      if (decodedToken.role !== role) {
        return res.status(403).json({ error: "Access denied" });
      }
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
};
export default checkUserRole;
