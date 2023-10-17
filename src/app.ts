import express from "express";
import logger from "./middleware/logger";
import { connection } from "./config/mysql.config";

const app = express();

app.use(express.json());
app.use(logger);

app.post("/api/create/user", async (req, res) => {
  const { username, email, password } = req.body;
  const userId = Math.floor(Math.random() * 1000000);
  const createdAt = new Date();

  try {
    const pool = await connection();
    const sql =
      "INSERT INTO users (user_id, username, email, password, created_at) VALUES (?, ?, ?, ?, ?)";
    const [rows] = await pool.execute(sql, [
      userId,
      username,
      email,
      password,
      createdAt,
    ]);

    res.status(201).json({
      message: "User created successfully",
      userId,
      rows,
    });
  } catch (err) {
    res.status(500).json({
      message: "An error occurred",
      error: err,
    });
  }
});

app.get("/", (_req, res) => {
  res.status(200).send({
    message: "Hello world!",
  });
});

export default app;
