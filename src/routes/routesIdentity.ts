import express, { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { transporter } from "../config/nodemailer.config";

import cookieParser from "cookie-parser";
import { pool } from "../config/mysql.config";
import { RowDataPacket } from "mysql2";
import { authenticateAdmin } from "../middleware/authentication";

dotenv.config();
const SALT = process.env.SALT;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REGISTER_TOKEN_SECRET = process.env.REGISTER_TOKEN_SECRET;
const RESETPASSWOD_TOKEN_SECRET = process.env.RESETPASSWOD_TOKEN_SECRET;

const NODEMAILER_USER = process.env.NODEMAILER_USER;
const FRONTEND_URL = process.env.FRONTEND_URL;

const router = express.Router();
router.use(cookieParser());

router.post(
  "/invite",
  [authenticateAdmin],
  async (req: Request, res: Response) => {
    const { email, username } = req.body;

    if (!email || !username) {
      res.status(400).json({ error: "Missing email or username" });
      return;
    }

    const invitedUser_id = uuidv4();
    const created_at = new Date();

    const sqlQuery =
      "INSERT INTO invitedUsers (invitedUser_id, username, email, created_at) VALUES (?, ?, ?, ?)";
    const sqlQueryValues = [invitedUser_id, username, email, created_at];

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

    const registerToken = jwt.sign(
      { email: email },
      REGISTER_TOKEN_SECRET as string,
      { expiresIn: "15m" },
    );

    const mailOptions = {
      from: NODEMAILER_USER,
      to: email,
      subject: "Invitation to newsfeed",
      text: `Click this link to register:${FRONTEND_URL}/register?registerToken=${registerToken} the link is valid for 15 minutes`,
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

router.post("/register", async (req: Request, res: Response) => {
  if (!SALT) {
    res.status(500).json({ error: "Salt error" });
    return;
  }

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
    decoded = jwt.verify(registerToken, REGISTER_TOKEN_SECRET as string);
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
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: "Missing data" });
    return;
  }

  /**
   * Verify email
   */
  if (decoded.email !== email) {
    res.status(401).json({ error: "Wrong email" });
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

router.post("/sendEmailTest", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Missing email" });
    return;
  }

  const mailOptions = {
    from: NODEMAILER_USER,
    to: email,
    subject: "Ämne",
    text: "Text i medelandet",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: "Email error" });
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).json({ message: "Email sent" });
    }
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }
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

    connection.release();

    const userRole = roleRows.length > 0 ? roleRows[0].role_name : null;

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: "Wrong password or email" });
      return;
    }

    const accessToken = jwt.sign(
      { user_id: user.user_id, role: userRole },
      ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { user_id: user.user_id, role: userRole },
      REFRESH_TOKEN_SECRET as string,
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

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/refresh", async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    res.status(401).json({ error: "Refresh Token not found" });
    return;
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET as string,
    ) as { user_id: string; role: string };

    if (!decoded.user_id) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const accessToken = jwt.sign(
      { user_id: decoded.user_id, role: decoded.role },
      ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" },
    );

    res.cookie("access_token", accessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15minuter
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res
      .status(200)
      .json({ message: "access token refreshed", role: decoded.role });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Token not valid" });
  }
});

router.post("/requestPasswordReset", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Missing email" });
    return;
  }

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
    RESETPASSWOD_TOKEN_SECRET as string,
    { expiresIn: "15m" },
  );

  const mailOptions = {
    from: NODEMAILER_USER,
    to: email,
    subject: "Invitation to newsfeed",
    text: `Click this link to reset your password :${FRONTEND_URL}/resetPassword?resetPasswordToken=${resetPasswordToken} the link is valid for 15 minutes`,
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

router.put("/resetPassword", async (req: Request, res: Response) => {
  const reqResetPasswordToken = req.headers["authorization"];
  if (!reqResetPasswordToken) {
    res.status(400).json({ error: "Missing reset password token" });
    return;
  }
  const resetPasswordToken = reqResetPasswordToken.substring(7);

  let decoded: JwtPayload | string = "";
  try {
    decoded = jwt.verify(
      resetPasswordToken,
      RESETPASSWOD_TOKEN_SECRET as string,
    );
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

  if (!SALT) {
    res.status(500).json({ error: "Salt error" });
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

router.put(
  "/edited",
  [authenticateAdmin],
  async (_req: Request, res: Response) => {
    res.send("Edited");
  },
);

export default router;
