import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  authenticateAdmin,
  authenticateUser,
} from "../middleware/authentication";
import { pool } from "../config/mysql.config";
import { RowDataPacket } from "mysql2";

const router = express.Router();

router.get(
  "/getAll",
  [authenticateUser],
  async (_req: Request, res: Response) => {
    const sqlQuery = "SELECT * FROM article";
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
      const created_at = new Date();
      const used_id = req.body.user_id;

      const sqlQuery =
        "INSERT INTO article (id, title, link, content, user_id, created_at, edited_at) VALUES (?, ?, ?, ?, ?, ?,null";

      const connection = await pool.getConnection();

      await connection.query(sqlQuery, [
        id,
        title,
        link,
        content,
        used_id,
        created_at,
        null,
      ]);

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
  "/edit/:id",
  [authenticateAdmin],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, link, content } = req.body;
      const edited_at = new Date();

      const sqlQuery =
        "UPDATE article SET title = ?, link = ?, content = ?, edited_at = ? WHERE id = ?";
      const connection = await pool.getConnection();

      const [results] = (await connection.query(sqlQuery, [
        title,
        link,
        content,
        edited_at,
        id,
      ])) as RowDataPacket[];

      connection.release();

      if (results.affectedRows === 0) {
        res.status(404).json({ message: "Article not found" });
        return;
      }
      res
        .status(200)
        .json({ message: "Article updated successfully", article: results });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/delete/:id",
  [authenticateAdmin],
  async (_req: Request, res: Response) => {
    try {
      const { id } = _req.params;

      const sqlQuery = "DELETE FROM article WHERE id = ?";
      const connection = await pool.getConnection();

      const [results] = (await connection.query(sqlQuery, [
        id,
      ])) as RowDataPacket[];

      connection.release();

      if (results.affectedRows === 0) {
        res.status(404).json({ message: "Article not found" });
        return;
      }
      res.status(200).json({ message: "Article deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
