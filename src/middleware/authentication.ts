import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { NextFunction, Response, Request } from "express";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const reqToken = req.headers["authorization"];
  if (!reqToken) {
    res
      .status(401)
      .json({ error: "Not authorized", message: "No token found" });
    return;
  }

  const token = reqToken.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;

    req.body.user_id = decoded.user_id;
    req.body.role = decoded.role;

    if (decoded.role !== "admin") {
      res.status(401).json({ error: "Not authorized" });
      return;
    }

    res.status(200).json({ message: "Authorized" });

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Not authorized" });
  }
};

const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const reqToken = req.headers["authorization"];
  if (!reqToken) {
    res.status(401).json({ error: "Not authorized" });
    return;
  }

  const token = reqToken.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;

    req.body.user_id = decoded.user_id;
    req.body.role = decoded.role;

    if (decoded.role !== "user" && decoded.role !== "admin") {
      res.status(401).json({ error: "Not authorized" });
      return;
    }

    res.status(200).json({ message: "Authorized" });

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Not authorized" });
  }
};

export { authenticateAdmin, authenticateUser };
