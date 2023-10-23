import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const NODEMAILER_HOST = process.env.NODEMAILER_HOST;
const NODEMAILER_USER = process.env.NODEMAILER_USER;
const NODEMAILER_PASSWORD = process.env.NODEMAILER_PASSWORD;

export const transporter = nodemailer.createTransport({
  host: NODEMAILER_HOST,
  port: 465,
  secure: true,
  auth: {
    user: NODEMAILER_USER,
    pass: NODEMAILER_PASSWORD,
  },
});
