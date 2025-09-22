// src/utils/mail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // برای پورت 465 باید true باشد
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // اگر با ارور self-signed certificate مواجه شدید، این خط را اضافه کنید:
    // rejectUnauthorized: false
  }
});

/**
 * ارسال ایمیل ساده (متن ساده)
 * @param {string} to       گیرنده
 * @param {string} subject  عنوان
 * @param {string} text     متن ایمیل
 * @returns {Promise}
 */
export const sendMail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };
  return transporter.sendMail(mailOptions);
};
