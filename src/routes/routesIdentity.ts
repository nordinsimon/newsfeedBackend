import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { pool } from "../config/mysql.config";
import { RowDataPacket } from "mysql2";

dotenv.config();
const SALT = process.env.SALT;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const router = express.Router();
router.use(cookieParser());

router.post("/invite", async (req: Request, res: Response) => {
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

router.post("/register", async (_req, res) => {
  res.send("Register");
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }
  try {
    const connection = await pool.getConnection();
    const [rows] = (await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    )) as RowDataPacket[];
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ error: "Wrong email adress" });
    }
    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const accessToken = jwt.sign(
      { user_id: user.user_id },
      ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { user_id: user.user_id },
      REFRESH_TOKEN_SECRET as string
    );

    res.cookie("access_token", accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15minuter
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.cookie("refresh_token", refreshToken, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dagar
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/api/identity/refresh",
    });

    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Database error" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh Token not found" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET as string
    ) as { user_id: string };

    if (!decoded.user_id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const accessToken = jwt.sign(
      { user_id: decoded.user_id },
      ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    res.cookie("access_token", accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15minuter
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.status(200).json({ message: "access token refreshed" });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Refresh token not valid" });
  }
});

router.post("/requestPasswordReset", async (_req, res) => {
  res.send("Request password reset");
});

router.put("/edited", async (_req, res) => {
  res.send("Edited");
});

export default router;
