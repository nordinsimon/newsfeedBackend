import { NextFunction } from "express";
import jwt from "jsonwebtoken";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({ error: "Token not provided" });
    }

    const decodedToken = jwt.verify(token, YOUR_SECRET_KEY);

    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireUserRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden" });
    }
  };
};

export { authMiddleware, requireUserRole };
