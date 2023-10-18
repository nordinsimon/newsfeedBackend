import express from "express";
import logger from "./middleware/logger";
import { connection } from "./config/mysql.config";

const app = express();

app.use(express.json());
app.use(logger);

app.get("/api/users", async (_req, res) => {
  try {
    const pool = await connection();
    const [rows] = await pool.query("SELECT * FROM `users`");
    res.status(200).json(rows);
  } catch (err) {
    console.error("An error occurred while running the query:", err);
    res.status(500).send("Failed to query database");
  }
});

app.get("/", (_req, res) => {
  res.status(200).send({
    message: "Hello world!",
  });
});

export default app;
