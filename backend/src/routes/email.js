// src/routes/email.js
import express from "express";
import { sendMail } from "../utils/mail.js";

const router = express.Router();

/**
 * POST /api/send-email
 * Body: { to, subject, text }
 */
router.post("/", async (req, res) => {
  const { to, subject, text } = req.body;

  // اعتبارسنجی ساده
  if (!to || !subject || !text) {
    return res
      .status(400)
      .json({ error: "فیلدهای to, subject و text الزامی‌اند" });
  }

  try {
    await sendMail(to, subject, text);
    res.json({ message: "ایمیل با موفقیت ارسال شد" });
  } catch (err) {
    console.error("❌ خطای ارسال ایمیل:", err);
    res.status(500).json({ error: "خطا در ارسال ایمیل" });
  }
});

export default router;
