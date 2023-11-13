import express, { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { transporter } from "../config/nodemailer.config";

import cookieParser from "cookie-parser";
import { pool } from "../config/mysql.config";
import { RowDataPacket } from "mysql2";
import {
  authenticateAdmin,
  authenticateUser,
} from "../middleware/authentication";

import commonPasswords from "../data/commonPasswors.json";

dotenv.config();
const SALT = process.env.SALT as string;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
const REGISTER_TOKEN_SECRET = process.env.REGISTER_TOKEN_SECRET as string;
const RESETPASSWOD_TOKEN_SECRET = process.env
  .RESETPASSWOD_TOKEN_SECRET as string;

const NODEMAILER_USER = process.env.NODEMAILER_USER;
const FRONTEND_URL = process.env.FRONTEND_URL;

const USER_ROLE_ID = process.env.USER_ROLE_ID;

const router = express.Router();
router.use(cookieParser());

router.post(
  "/invite",
  [authenticateAdmin],
  async (req: Request, res: Response) => {
    const { email, name } = req.body;

    if (!email || !name) {
      res.status(400).json({ error: "Missing email or name" });
      return;
    }

    email.toLowerCase();

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(email)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    const sqlQueryUsers = "SELECT * FROM users WHERE email = ?";

    try {
      const connection = await pool.getConnection();
      const [user] = await connection.query(sqlQueryUsers, [email]);

      if (Array.isArray(user) && user.length > 0) {
        res.status(400).json({ error: "User already exists" });
        return;
      }

      connection.release();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.code });
      return;
    }

    const invitedUser_id = uuidv4();
    const created_at = new Date();
    created_at.setHours(created_at.getHours() + 2);

    const sqlQuery =
      "INSERT INTO invitedUsers (invitedUser_id, name, email, created_at) VALUES (?, ?, ?, ?)";
    const sqlQueryValues = [invitedUser_id, name, email, created_at];

    try {
      const connection = await pool.getConnection();
      await connection.query(sqlQuery, sqlQueryValues);
      connection.release();
    } catch (error) {
      console.error(error);
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "User already invited" });
        return;
      }
      res.status(500).json({ error: error.code });
      return;
    }

    const registerToken = jwt.sign({ email: email }, REGISTER_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    const mailOptions = {
      from: NODEMAILER_USER,
      to: email,
      subject: "Welcome to Newsfeed - Register Your Account",
      text:
        `Hello ${name},\n\n` +
        "We're excited to welcome you to Newsfeed!\n\n" +
        "To complete your registration, simply click on the link below:\n\n" +
        `${FRONTEND_URL}/register?registerToken=${registerToken}&email=${email}\n\n` +
        "Please note that the link is valid for 15 minutes, so be sure to register promptly.\n\n" +
        "If you didn't request this registration, please disregard this email.\n\n" +
        "Thank you for choosing Newsfeed!\n\n" +
        "Best regards,\n" +
        "The Newsfeed Team",
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: "Email error" });
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).json({ message: "Email sent", registerToken });
      }
    });
  },
);

router.delete(
  "/invite",
  [authenticateAdmin],
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Missing email" });
      return;
    }

    const sqlQuery = "DELETE FROM invitedUsers WHERE email = ?";
    try {
      const connection = await pool.getConnection();
      await connection.query(sqlQuery, [email]);
      connection.release();
      res.status(200).json({ message: "User deleted" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.get(
  "/verifyToken",
  [authenticateUser],
  async (req: Request, res: Response) => {
    const reqRole = req.body.role;
    if (reqRole === "admin") {
      res.status(200).json({ message: "Token is valid", role: "admin" });
      return;
    }
    res.status(200).json({ message: "Token is valid" });
  },
);

router.get("/verifyRegisterToken", async (req: Request, res: Response) => {
  const reqRegisterToken = req.headers["authorization"];
  if (!reqRegisterToken) {
    res.status(400).json({ error: "Missing register token" });
    return;
  }
  const registerToken = reqRegisterToken.substring(7);

  let decoded: JwtPayload | string = "";
  try {
    decoded = jwt.verify(registerToken, REGISTER_TOKEN_SECRET);
  } catch (err) {
    console.error("ERROR", err);
  }

  if (typeof decoded === "string") {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  res.status(200).json({ message: "Token is valid" });
});

router.post("/register", async (req: Request, res: Response) => {
  /**
   * Get register token from header
   */
  const reqRegisterToken = req.headers["authorization"];
  if (!reqRegisterToken) {
    res.status(400).json({ error: "Missing register token" });
    return;
  }
  const registerToken = reqRegisterToken.substring(7);

  /**
   * Verify register token
   */
  let decoded: JwtPayload | string = "";
  try {
    decoded = jwt.verify(registerToken, REGISTER_TOKEN_SECRET);
    console.log("decoded", decoded);
  } catch (err) {
    console.error("ERROR", err);
  }
  if (typeof decoded === "string") {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  /**
   * Get user data from body
   */
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Missing data" });
    return;
  }

  const passwordCheck = checkPassword(password);
  if (passwordCheck !== "Password ok") {
    res.status(400).json({ error: passwordCheck });
    return;
  }

  const email = decoded.email;

  const sqlQueryInvitedUsers = "SELECT * FROM invitedUsers WHERE email = ?";

  try {
    const connection = await pool.getConnection();
    const [userIsInvited] = await connection.query(sqlQueryInvitedUsers, [
      email,
    ]);

    if (Array.isArray(userIsInvited) && userIsInvited.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    connection.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
    return;
  }

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

  const sqlQueryUserRole =
    "INSERT INTO userRoles (user_id, role_id) VALUES (?, ?)";
  const sqlQueryUserRoleValues = [user_id, USER_ROLE_ID];

  const sqlQueryInvitedUsersDelete = "DELETE FROM invitedUsers WHERE email = ?";

  try {
    const connection = await pool.getConnection();
    await connection.query(sqlQueryUsers, sqlQueryValues);
    await connection.query(sqlQueryUserRole, sqlQueryUserRoleValues);
    await connection.query(sqlQueryInvitedUsersDelete, [email]);
    connection.release();
    res.status(201).json({ message: "User created" });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Username alredy exists" });
      return;
    }
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }
  email.toLowerCase();
  try {
    const connection = await pool.getConnection();
    const [rows] = (await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
    )) as RowDataPacket[];

    if (rows.length === 0) {
      res.status(401).json({ error: "Wrong email address or password" });
      return;
    }
    const user = rows[0];

    const [roleRows] = (await connection.query(
      "SELECT role_name FROM roles INNER JOIN userRoles ON roles.role_id = userRoles.role_id WHERE userRoles.user_id = ?",
      [user.user_id],
    )) as RowDataPacket[];

    const userRole = roleRows.length > 0 ? roleRows[0].role_name : null;

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: "Wrong password or email" });
      return;
    }

    const accessToken = jwt.sign(
      { user_id: user.user_id, role: userRole },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { user_id: user.user_id, role: userRole },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "60m" },
    );

    await connection.query(
      "INSERT INTO refreshTokens (token, user_id, expires_at) VALUES (?, ?, ?)",
      [
        refreshToken,
        user.user_id,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ],
    );
    connection.release();

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/refresh", async (req: Request, res: Response) => {
  console.log("refresh");
  const reqToken = req.headers["authorization"];
  if (!reqToken) {
    res
      .status(401)
      .json({ error: "Not authorized", message: "No token found" });
    return;
  }

  const refreshToken = reqToken.substring(7);

  if (!refreshToken) {
    res.status(401).json({ error: "Refresh Token not found" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as {
      user_id: string;
      role: string;
    };

    if (!decoded.user_id) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const connection = await pool.getConnection();
    const [rows] = (await connection.query(
      "SELECT * FROM refreshTokens WHERE token = ? AND user_id = ?",
      [refreshToken, decoded.user_id],
    )) as RowDataPacket[];

    connection.release();

    if (rows.length === 0) {
      res.status(401).json({ error: "Refresh Token not valid" });
      return;
    }

    const accessToken = jwt.sign(
      { user_id: decoded.user_id, role: decoded.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    res.status(200).json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Token not valid" });
  }
});

router.get(
  "/logout",
  [authenticateUser],
  async (req: Request, res: Response) => {
    const userId = req.body.user_id;

    if (!userId) {
      res.status(400).json({ error: "Missing user id" });
      return;
    }

    const sqlQuerydeleteRefreshTokens =
      "DELETE FROM refreshTokens WHERE user_id = ?";

    try {
      const connection = await pool.getConnection();
      await connection.query(sqlQuerydeleteRefreshTokens, [userId]);

      connection.release();

      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.post("/requestPasswordReset", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Missing email" });
    return;
  }
  email.toLowerCase();

  const sqlQuery = "SELECT * FROM users WHERE email = ?";
  try {
    const connection = await pool.getConnection();
    const [result] = (await connection.query(sqlQuery, [
      email,
    ])) as RowDataPacket[];

    if (result.length === 0) {
      res.status(200).json({
        message: "If there is a user with that Email address you get an email",
      });
      return;
    }

    connection.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
    return;
  }

  const resetPasswordToken = jwt.sign(
    { email: email },
    RESETPASSWOD_TOKEN_SECRET,
    { expiresIn: "15m" },
  );

  const mailOptions = {
    from: NODEMAILER_USER,
    to: email,
    subject: "Password Reset for Newsfeed Account",
    text:
      `Hello,\n\n` +
      "We received a request to reset your Newsfeed account password. Please click the link below to proceed:\n\n" +
      `${FRONTEND_URL}/resetPassword?resetPasswordToken=${resetPasswordToken}\n\n` +
      "Please note that this link is valid for 15 minutes. If you did not request this password reset, you can ignore this email.\n\n" +
      "Thank you for using Newsfeed!\n\n" +
      "Best regards,\n" +
      "The Newsfeed Team",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: "Email error" });
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).json({
        message: "If there is a user with that Email address you get an email",
        resetPasswordToken: resetPasswordToken,
      });
    }
  });
});

router.get("/verifyResetPasswordToken", async (req: Request, res: Response) => {
  const reqResetPasswordToken = req.headers["authorization"];
  if (!reqResetPasswordToken) {
    res.status(400).json({ error: "Missing ResetPassword token" });
    return;
  }
  const resetPasswordToken = reqResetPasswordToken.substring(7);

  let decoded: JwtPayload | string = "";
  try {
    decoded = jwt.verify(resetPasswordToken, RESETPASSWOD_TOKEN_SECRET);
  } catch (err) {
    console.error("ERROR", err);
  }

  if (typeof decoded === "string") {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  res.status(200).json({ message: "Token is valid" });
});

router.put("/resetPassword", async (req: Request, res: Response) => {
  const reqResetPasswordToken = req.headers["authorization"];
  if (!reqResetPasswordToken) {
    res.status(400).json({ error: "Missing reset password token" });
    return;
  }
  const resetPasswordToken = reqResetPasswordToken.substring(7);

  let decoded: JwtPayload | string = "";
  try {
    decoded = jwt.verify(resetPasswordToken, RESETPASSWOD_TOKEN_SECRET);
  } catch (err) {
    console.error("ERROR", err);
  }

  if (typeof decoded === "string") {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const { email, password } = req.body;
  const decodedEmail = decoded.email;

  if (!email || !password) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }

  if (decodedEmail !== email) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const passwordCheck = checkPassword(password);
  if (passwordCheck !== "Password ok") {
    res.status(400).json({ error: passwordCheck });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT);

  const sqlQuery = "UPDATE users SET password = ? WHERE email = ?";

  try {
    const connection = await pool.getConnection();
    const [result] = (await connection.query(sqlQuery, [
      hashedPassword,
      email,
    ])) as RowDataPacket[];

    if (result.length === 0) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    connection.release();

    res.status(200).json({ message: "Updated password" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;

const checkPassword = (password: string) => {
  const passwordToCheck = password.toLowerCase();
  passwordToCheck.replace(/[^a-zA-Z0-9\s]/g, "");

  if (commonPasswords.includes(passwordToCheck)) {
    return "Password to common";
  }

  if (password.length < 10) {
    return "Password to short";
  }

  const hasUppercase = /[A-Z]/;
  const hasLowercase = /[a-z]/;
  const hasNumber = /\d/;
  const hasSpecialChar = /[!@#$%^&*()_+{}[\]:;<>,.?~\\]/;

  if (
    !hasUppercase.test(password) ||
    !hasLowercase.test(password) ||
    !hasNumber.test(password) ||
    !hasSpecialChar.test(password)
  ) {
    return "Password must contain at least one uppercase, one lowercase, one number and one special character";
  }
  return "Password ok";
};
