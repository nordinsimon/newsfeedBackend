import express from "express";
//import { pool } from "../config/mysqlConfig";

const router = express.Router();

router.get("/", async (_req, res) => {
  res.send("Recreate DB");
  /* try {
    const connection = await pool.getConnection();
    const [results] = await connection.query("SELECT * FROM users");
    connection.release();
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  } */
});

export default router;
