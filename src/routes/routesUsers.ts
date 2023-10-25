import express, { Request, Response } from "express";
import {
  authenticateAdmin,
  authenticateUser,
} from "../middleware/authentication";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

import { pool } from "../config/mysql.config";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const router = express.Router();

router.get(
  "/getAll",
  [authenticateAdmin],
  async (_req: Request, res: Response) => {
    const sqlQuery = "SELECT * FROM users";
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.query(sqlQuery);

      if (Array.isArray(results)) {
        results.forEach((result) => {
          if ("password" in result) {
            delete result.password;
          }
        });
      }
      connection.release();
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Database error" });
    }
  },
);

router.get(
  "/getById",
  [authenticateAdmin],
  async (req: Request, res: Response) => {
    const userId = req.body.id;

    if (!userId) {
      res.status(400).json({ error: "Missing user id" });
      return;
    }

    const sqlQuery = "SELECT * FROM users WHERE user_id = ?";
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.query(sqlQuery, [userId]);
      connection.release();

      if (Array.isArray(results) && results.length > 0) {
        const objResults = results[0];

        if ("password" in objResults) {
          delete objResults.password;
        }
        res.json(objResults);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.put(
  "/update",
  [authenticateAdmin],
  async (req: Request, res: Response) => {
    const { user_id, username, email } = req.body;

    if (!user_id || !username || !email) {
      res.status(400).json({ error: "Missing user id, username or email" });
      return;
    }

    const edited_at = new Date();

    const sqlQuery =
      "UPDATE users SET username = ?, email = ?, edited_at = ? WHERE user_id = ?";
    const sqlQueryValues = [username, email, edited_at, user_id];

    try {
      const connection = await pool.getConnection();
      await connection.query(sqlQuery, sqlQueryValues);
      connection.release();
      res.status(200).json({ message: "User updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.delete(
  "/delete",
  [authenticateAdmin],
  async (req: Request, res: Response) => {
    const userId = req.body.user_id;

    if (!userId) {
      res.status(400).json({ error: "Missing user id" });
      return;
    }

    const sqlQuery = "DELETE FROM users WHERE user_id = ?";
    try {
      const connection = await pool.getConnection();
      await connection.query(sqlQuery, [userId]);
      connection.release();
      res.status(200).json({ message: "User deleted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.get(
  "/getCurrent",
  [authenticateUser],
  async (req: Request, res: Response) => {
    const reqToken = req.headers["authorization"];
    if (!reqToken) {
      res.status(400).json({ error: "Missing token" });
      return;
    }
    const token = reqToken.substring(7);

    let decoded: JwtPayload | string = "";
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET as string);
    } catch (err) {
      console.error("ERROR", err);
    }
    if (typeof decoded === "string") {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const user_id = decoded.user_id;

    const sqlQuery = "SELECT * FROM users WHERE user_id = ?";
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.query(sqlQuery, [user_id]);
      connection.release();

      if (Array.isArray(results) && results.length > 0) {
        const objResults = results[0];

        if ("password" in objResults) {
          delete objResults.password;
        }
        res.json(objResults);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.put(
  "/setRoles",
  [authenticateAdmin],
  async (_req: Request, res: Response) => {
    res.send("Set roles");
  },
);

export default router;
