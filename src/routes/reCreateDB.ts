import express from "express";
import { pool } from "../config/mysql.config";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const SALT = process.env.SALT as string;

const adminRoleId = process.env.ADMIN_ROLE_ID as string;
const userRoleId = process.env.USER_ROLE_ID as string;

const userId = process.env.USER_ID as string;
const userEmail = process.env.USER_EMAIL as string;
const userName = process.env.USER_NAME as string;
const userPassword = process.env.USER_PASSWORD as string;

const adminUserId = process.env.ADMIN_USER_ID as string;
const adminUserEmail = process.env.ADMIN_USER_EMAIL as string;
const adminUserName = process.env.ADMIN_USER_NAME as string;
const adminUserPassword = process.env.ADMIN_USER_PASSWORD as string;

const router = express.Router();

router.get("/setup", async (_req, res) => {
  const addRoles1 = await addRoles(adminRoleId, "admin");
  const addRoles2 = await addRoles(userRoleId, "user");
  const addUsers1 = await addUser(
    userId,
    userEmail,
    userName,
    userPassword,
    userRoleId,
  );
  const addUsers2 = await addUser(
    adminUserId,
    adminUserEmail,
    adminUserName,
    adminUserPassword,
    adminRoleId,
  );
  const addArticle1 = await addArticle(
    "Amazing news, read all about it!",
    "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.",
    adminUserId,
  );
  const addArticle2 = await addArticle(
    "SPORTS! SPORTS! SPORTS!",
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    adminUserId,
  );
  const addArticle3 = await addArticle(
    "A classical piece of music!",
    "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
    adminUserId,
  );

  if (
    addRoles1 !== undefined ||
    addRoles2 !== undefined ||
    addUsers1 !== undefined ||
    addUsers2 !== undefined ||
    addArticle1 !== undefined ||
    addArticle2 !== undefined ||
    addArticle3 !== undefined
  ) {
    res.status(500).send("Database setup failed, to setup DB drop all tables");
    return;
  }

  res.send("Database setup complete");
});

const addUser = async (
  id: string,
  email: string,
  username: string,
  password: string,
  role_id: string,
) => {
  const user_id = id;
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

const addArticle = async (title: string, content: string, user_id: string) => {
  const id = uuidv4();
  const created_at = new Date();

  const sqlQueryArticles =
    "INSERT INTO article (id, title, link, content, user_id, created_at, edited_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const sqlQueryValuesArticles = [
    id,
    title,
    "https://www.youtube.com/embed/Sh6lK57Cuk4?si=z8Ev11U1G8KYZYu0",
    content,
    user_id,
    created_at,
    null,
  ];

  try {
    const connection = await pool.getConnection();
    await connection.query(sqlQueryArticles, sqlQueryValuesArticles);
    connection.release();
  } catch (error) {
    console.error("error i addArticle:", error);
    return error;
  }
};

router.delete("/allData", async (_req, res) => {
  const sqlQueryUsers = "DELETE FROM users";
  const sqlQueryRoles = "DELETE FROM roles";
  const sqlQueryUserRoles = "DELETE FROM userRoles";
  const sqlQueryArticles = "DELETE FROM article";
  const sqlQueryInvitedUsers = "DELETE FROM invitedUsers";
  const sqlQueryRefreshTokens = "DELETE FROM refreshTokens";

  try {
    const connection = await pool.getConnection();
    await connection.query(sqlQueryUserRoles);
    await connection.query(sqlQueryArticles);
    await connection.query(sqlQueryRefreshTokens);
    await connection.query(sqlQueryInvitedUsers);
    await connection.query(sqlQueryUsers);
    await connection.query(sqlQueryRoles);
    connection.release();
  } catch (error) {
    console.error("error i deleteAllData:", error);
    res.status(500).send("Database delete failed");
    return;
  }

  res.send("Database delete complete");
});

export default router;
