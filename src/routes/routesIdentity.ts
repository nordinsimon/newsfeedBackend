import express from "express";
//import { pool } from "../config/mysqlConfig";

const router = express.Router();

router.post("/register", async (_req, res) => {
  res.send("Register");
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
