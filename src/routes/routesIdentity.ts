import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { pool } from "../config/mysql.config";

dotenv.config();
const SALT = process.env.SALT;

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  if (!SALT) {
    res.status(500).json({ error: "Salt error" });
    return;
  }
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: "Missing data" });
    return;
  }

  const user_id = uuidv4();
  const created_at = new Date();
  const hashedPassword = await bcrypt.hash(password, SALT);

  const sqlQuery =
    "INSERT INTO users (user_id, username, email, password, created_at, edited_at) VALUES (?, ?, ?, ?, ?, ?)";
  const sqlQueryValues = [
    user_id,
    username,
    email,
    hashedPassword,
    created_at,
    null,
  ];

  console.log(sqlQueryValues);

  try {
    const connection = await pool.getConnection();
    await connection.query(sqlQuery, sqlQueryValues);
    connection.release();
    res.status(201).json({ message: "User created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/setPasswordNewUser", async (_req, res) => {
  res.send("Set password new user");
});

router.post("/login", async (_req, res) => {
  res.send("Login");
});

router.post("/requestPasswordReset", async (_req, res) => {
  res.send("Request password reset");
});

router.put("/edited", async (_req, res) => {
  res.send("Edited");
});

export default router;
