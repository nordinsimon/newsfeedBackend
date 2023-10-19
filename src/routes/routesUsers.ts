import express from "express";
import { pool } from "../config/mysql.config";

const router = express.Router();

router.get("/getAll", async (_req, res) => {
  const sqlQuery = "SELECT * FROM users";
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(sqlQuery);
    connection.release();
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/getById", async (_req, res) => {
  res.send("Get user by id");
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
