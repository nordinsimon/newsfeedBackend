import express, { Request, Response } from "express";
import { pool } from "../config/mysql.config";

const router = express.Router();

router.get("/getAll", async (_req, res: Response) => {
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
});

router.get("/getById", async (req: Request, res: Response) => {
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
});

router.put("/update", async (_req, res) => {
  res.send("Update user");
});

router.delete("/delete", async (_req, res) => {
  res.send("Delete user");
});

router.get("/getCurrent", async (_req, res) => {
  res.send("Get current user");
});

router.put("/setRoles", async (_req, res) => {
  res.send("Set roles");
});

export default router;
