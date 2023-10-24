import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  authenticateAdmin,
  authenticateUser,
} from "../middleware/authentication";
import { pool } from "../config/mysql.config";

const router = express.Router();

router.get(
  "/getAll",
  [authenticateUser],
  async (_req: Request, res: Response) => {
    const sqlQuery = "SELECT * FROM newsfeeddb.article";
    try {
      const connection = await pool.getConnection();
      const [results] = await connection.query(sqlQuery);
      connection.release();

      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Database error" });
    }
  }
);

router.post(
  "/create",
  [authenticateAdmin],
  async (req: Request, res: Response) => {
    try {
      const id = uuidv4();
      const { title, link, content } = req.body;
      const used_id = req.body.user_id;

      const sqlQuery =
        "INSERT INTO article (id, title, link, content, user_id, created_at, edited_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())";

      const connection = await pool.getConnection();

      await connection.query(sqlQuery, [id, title, link, content, used_id]);

      connection.release();

      res
        .status(201)
        .json({ message: "Article created successfully", articleId: id });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.put(
  "/edit",
  [authenticateAdmin],
  async (_req: Request, res: Response) => {
    res.send("Edit news");
  }
);

router.delete(
  "/delete",
  [authenticateAdmin],
  async (_req: Request, res: Response) => {
    res.send("Delete news");
  }
);

export default router;
