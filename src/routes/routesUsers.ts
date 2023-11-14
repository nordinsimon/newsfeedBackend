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
    const sqlQuery =
      "SELECT users.user_id, users.username, users.email, roles.role_name FROM users INNER JOIN userRoles ON users.user_id = userRoles.user_id INNER JOIN roles ON userRoles.role_id = roles.role_id;";
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.query(sqlQuery);

      if (Array.isArray(results)) {
        for (let i = 0; i < results.length; i++) {
          const resultObj = results[i] as { [key: string]: string };
          const email = resultObj.email;
          const emailStart = email.substring(0, 6);
          if (emailStart === "delete") {
            results.splice(i, 1);
            i--;
          }
          if ("password" in resultObj) {
            delete resultObj.password;
          }
        }
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
    edited_at.setHours(edited_at.getHours() + 2);

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
    const userId = req.body.userId;

    if (!userId) {
      res.status(400).json({ error: "Missing user id" });
      return;
    }

    const sqlQueryUserId =
      "UPDATE users SET username = ? , email = ? , password = ? WHERE user_id = ?";
    const sqlQueryRefreshToken = "DELETE FROM refreshTokens WHERE user_id = ?";

    const sqlQueryUserIdValues = [
      `deleted${userId}`,
      `deleted${userId}`,
      `deleted${userId}`,
      userId,
    ];

    try {
      const connection = await pool.getConnection();
      await connection.query(sqlQueryRefreshToken, [userId]);
      await connection.query(sqlQueryUserId, sqlQueryUserIdValues);

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
  async (req: Request, res: Response) => {
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      res.status(400).json({ error: "Missing user_id or role_name" });
      return;
    }

    const connection = await pool.getConnection();
    try {
      const [userExists] = await connection.query(
        "SELECT * FROM users WHERE user_id = ?",
        [userId],
      );
      if (Array.isArray(userExists) && userExists.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const query = `
        UPDATE userRoles
        SET role_id = (SELECT role_id FROM roles WHERE role_name = ?)
        WHERE user_id = ?
      `;

      await connection.query(query, [roleName, userId]);

      res.status(200).json({ message: "User role updated" });
      connection.release();
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
