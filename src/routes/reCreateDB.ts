import express from "express";
import { pool } from "../config/mysql.config";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const SALT = process.env.SALT as string;

const adminRoleId = process.env.ADMIN_ROLE_ID as string;
const userRoleId = process.env.USER_ROLE_ID as string;

const userEmail = process.env.USER_EMAIL as string;
const userName = process.env.USER_NAME as string;
const userPassword = process.env.USER_PASSWORD as string;

const adminUserEmail = process.env.ADMIN_USER_EMAIL as string;
const adminUserName = process.env.ADMIN_USER_NAME as string;
const adminUserPassword = process.env.ADMIN_USER_PASSWORD as string;

const router = express.Router();

router.get("/setup", async (_req, res) => {
  const addRoles1 = await addRoles(adminRoleId, "admin");
  const addRoles2 = await addRoles(userRoleId, "user");
  const addUsers1 = await addUser(
    userEmail,
    userName,
    userPassword,
    userRoleId,
  );
  const addUsers2 = await addUser(
    adminUserEmail,
    adminUserName,
    adminUserPassword,
    adminRoleId,
  );

  if (
    addRoles1 !== undefined ||
    addRoles2 !== undefined ||
    addUsers1 !== undefined ||
    addUsers2 !== undefined
  ) {
    res.status(500).send("Database setup failed, to setup DB drop all tables");
  }

  res.send("Database setup complete");
});

const addUser = async (
  email: string,
  username: string,
  password: string,
  role_id: string,
) => {
  const user_id = uuidv4();
  const created_at = new Date();
  created_at.setHours(created_at.getHours() + 2);
  const hashedPassword = await bcrypt.hash(password, SALT);

  const sqlQueryUsers =
    "INSERT INTO users (user_id, username, email, password, created_at, edited_at) VALUES (?, ?, ?, ?, ?, ?)";
  const sqlQueryValues = [
    user_id,
    username,
    email,
    hashedPassword,
    created_at,
    null,
  ];

  const sqlQueryUsersRoles =
    "INSERT INTO userRoles ( user_id, role_id) VALUES (?, ?)";
  const sqlQueryValuesRoles = [user_id, role_id];

  try {
    const connection = await pool.getConnection();
    await connection.query(sqlQueryUsers, sqlQueryValues);
    await connection.query(sqlQueryUsersRoles, sqlQueryValuesRoles);
    connection.release();
  } catch (error) {
    console.error("error i addUser:", error);
    return error;
  }
};

const addRoles = async (role_id: string, role_name: string) => {
  const sqlQueryRoles = "INSERT INTO roles (role_id, role_name) VALUES (?, ?)";
  const sqlQueryValuesRoles = [role_id, role_name];

  try {
    const connection = await pool.getConnection();
    await connection.query(sqlQueryRoles, sqlQueryValuesRoles);
    connection.release();
  } catch (error) {
    console.error("error i addRoles:", error);
    return error;
  }
};

export default router;
