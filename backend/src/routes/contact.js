// contact.js
import express from "express";
import pool from "../utils/db.js";
import validator from "validator";

const router = express.Router();

/* ---------- Helpers ---------- */
const mobileRegex = /^(?:\+?98|0098|0)?9\d{9}$/;
const MAXS = {
  name: 100,
  phone: 15,
  email: 100,
  subject: 255,
  text: 2000,
};

function generatePlaceholders(count) {
  return Array(count).fill("?").join(",");
}

/* ---------- POST: ثبت درخواست جدید ---------- */
router.post("/", async (req, res) => {
  try {
    const raw = {
      name: req.body.name,
      phoneNum: req.body.phoneNum,
      email: req.body.email,
      subject: req.body.subject,
      text: req.body.text,
    };

    if (!raw.name || !raw.phoneNum || !raw.email || !raw.subject) {
      return res.status(400).json({ error: "فیلدهای مورد نیاز تکمیل نشده‌اند" });
    }

    const name = String(raw.name).trim().slice(0, MAXS.name);
    const phoneNum = String(raw.phoneNum).trim().slice(0, MAXS.phone);
    const email = String(raw.email).trim().slice(0, MAXS.email);
    const subject = String(raw.subject).trim().slice(0, MAXS.subject);
    const text = raw.text ? String(raw.text).trim().slice(0, MAXS.text) : "";

    if (!mobileRegex.test(phoneNum)) {
      return res.status(400).json({ error: "شماره تلفن نامعتبر است" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "ایمیل نامعتبر است" });
    }

    const sql = `
      INSERT INTO forms (name, phoneNumber, email, subject, message, isRead, deleted, starred, hasReplied)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0);
    `;
    const [result] = await pool.execute(sql, [name, phoneNum, email, subject, text]);

    res.status(201).json({
      message: "درخواست شما با موفقیت ثبت شد",
      id: result.insertId ?? null,
    });
  } catch (err) {
    console.error("DB error (POST /):", err);
    res.status(500).json({ error: "خطا در ثبت درخواست" });
  }
});

/* ---------- GET: دریافت لیست درخواست‌ها با فیلتر و صفحه‌بندی ---------- */
router.get("/list", async (req, res) => {
  try {
    const status = (req.query.status || "all").toLowerCase();
    const isDeleted = req.query.hasOwnProperty("isDeleted") ? req.query.isDeleted === "true" : undefined;
    const isStarred = req.query.hasOwnProperty("isStarred") ? req.query.isStarred === "true" : undefined;
    const hasReplied = req.query.hasOwnProperty("hasReplied") ? req.query.hasReplied === "true" : undefined;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const offset = (page - 1) * limit;

    let whereClauses = [];
    const params = [];

    if (isDeleted !== undefined) {
      whereClauses.push("deleted = ?");
      params.push(isDeleted ? 1 : 0);
    }

    if (status === "read") {
      whereClauses.push("isRead = 1");
    } else if (status === "unread") {
      whereClauses.push("isRead = 0");
    }

    if (isStarred !== undefined) {
      whereClauses.push("starred = ?");
      params.push(isStarred ? 1 : 0);
    }

    if (hasReplied !== undefined) {
      whereClauses.push("hasReplied = ?");
      params.push(hasReplied ? 1 : 0);
    }

    const where = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const countSql = `SELECT COUNT(*) as total FROM forms ${where}`;
    const [[countRow]] = await pool.query(countSql, params);
    const total = countRow ? countRow.total : 0;

    const sql = `SELECT id, name, phoneNumber, email, subject, message, isRead, deleted, starred, hasReplied, created_at FROM forms ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const queryParams = [...params, limit, offset];
    const [rows] = await pool.query(sql, queryParams);

    res.json({
      meta: { total, page, limit, pages: Math.ceil(total / limit || 1) },
      data: rows,
    });
  } catch (err) {
    console.error("DB error (GET /list):", err);
    res.status(500).json({ error: "خطا در دریافت داده‌ها" });
  }
});

/* ---------- GET: دریافت یک رکورد با شناسه ---------- */
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "شناسه نامعتبر است" });

  try {
    const [rows] = await pool.query(
      "SELECT id, name, phoneNumber, email, subject, message, isRead, deleted, starred, hasReplied, created_at FROM forms WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "رکوردی یافت نشد" });
    res.json(rows[0]);
  } catch (err) {
    console.error("DB error (GET /:id):", err);
    res.status(500).json({ error: "خطا در دریافت رکورد" });
  }
});

/* ---------- PATCH: bulk-update-read ---------- */
router.patch("/bulk-update-read", async (req, res) => {
  const { ids, value } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "فیلد 'ids' باید یک آرایه غیرخالی باشد." });
  if (typeof value !== "number" || (value !== 0 && value !== 1)) return res.status(400).json({ error: "فیلد 'value' باید 0 یا 1 باشد." });

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (!validIds.length) return res.status(400).json({ error: "هیچ شناسهٔ معتبری یافت نشد." });

  try {
    const placeholders = generatePlaceholders(validIds.length);
    const sql = `UPDATE forms SET isRead = ? WHERE id IN (${placeholders}) AND deleted = 0`;
    const params = [value, ...validIds];

    const [result] = await pool.execute(sql, params);

    res.json({
      message: `وضعیت خوانده/نخوانده ${result.affectedRows} رکورد(ها) با موفقیت به‌روز شد.`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("DB error (PATCH /bulk-update-read):", err);
    res.status(500).json({ error: "خطا در به‌روزرسانی وضعیت خوانده/نخوانده" });
  }
});

/* ---------- PATCH: bulk-update-starred ---------- */
router.patch("/bulk-update-starred", async (req, res) => {
  const { ids, value } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "فیلد 'ids' باید یک آرایه غیرخالی باشد." });
  if (typeof value !== "number" || (value !== 0 && value !== 1)) return res.status(400).json({ error: "فیلد 'value' باید 0 یا 1 باشد." });

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (!validIds.length) return res.status(400).json({ error: "هیچ شناسهٔ معتبری یافت نشد." });

  try {
    const placeholders = generatePlaceholders(validIds.length);
    const sql = `UPDATE forms SET starred = ? WHERE id IN (${placeholders}) AND deleted = 0`;
    const params = [value, ...validIds];

    const [result] = await pool.execute(sql, params);

    res.json({
      message: `وضعیت ستاره‌دار ${result.affectedRows} رکورد(ها) با موفقیت به‌روز شد.`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("DB error (PATCH /bulk-update-starred):", err);
    res.status(500).json({ error: "خطا در به‌روزرسانی وضعیت ستاره‌دار" });
  }
});

/* ---------- PATCH: bulk-delete (Soft Delete) ---------- */
router.patch("/bulk-delete", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "فیلد 'ids' باید یک آرایه غیرخالی باشد." });

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (!validIds.length) return res.status(400).json({ error: "هیچ شناسهٔ معتبری یافت نشد." });

  try {
    const placeholders = generatePlaceholders(validIds.length);
    const sql = `UPDATE forms SET deleted = 1 WHERE id IN (${placeholders}) AND deleted = 0`;
    const params = [...validIds];

    const [result] = await pool.execute(sql, params);

    res.json({
      message: `${result.affectedRows} رکورد(ها) با موفقیت حذف (نرم) شدند.`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("DB error (PATCH /bulk-delete):", err);
    res.status(500).json({ error: "خطا در حذف دسته‌ای رکوردها" });
  }
});

/* ---------- PATCH: bulk-restore ---------- */
router.patch("/bulk-restore", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "فیلد 'ids' باید یک آرایه غیرخالی باشد." });

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (!validIds.length) return res.status(400).json({ error: "هیچ شناسهٔ معتبری یافت نشد." });

  try {
    const placeholders = generatePlaceholders(validIds.length);
    const sql = `UPDATE forms SET deleted = 0 WHERE id IN (${placeholders}) AND deleted = 1`;
    const params = [...validIds];

    const [result] = await pool.execute(sql, params);

    res.json({
      message: `${result.affectedRows} رکورد(ها) با موفقیت بازیابی شدند.`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("DB error (PATCH /bulk-restore):", err);
    res.status(500).json({ error: "خطا در بازیابی دسته‌ای رکوردها" });
  }
});

/* ---------- DELETE: bulk-delete-permanent ---------- */
router.delete("/bulk-delete-permanent", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "فیلد 'ids' باید یک آرایه غیرخالی باشد." });

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (!validIds.length) return res.status(400).json({ error: "هیچ شناسهٔ معتبری یافت نشد." });

  try {
    const placeholders = generatePlaceholders(validIds.length);
    const sql = `DELETE FROM forms WHERE id IN (${placeholders}) AND deleted = 1`;
    const params = [...validIds];

    const [result] = await pool.execute(sql, params);

    res.json({
      message: `${result.affectedRows} رکورد(ها) با موفقیت به طور دائم حذف شدند.`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("DB error (DELETE /bulk-delete-permanent):", err);
    res.status(500).json({ error: "خطا در حذف دائم دسته‌ای رکوردها" });
  }
});

/* ---------- PATCH: bulk-update-replied ---------- */
router.patch("/bulk-update-replied", async (req, res) => {
  const { ids, value } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "فیلد 'ids' باید یک آرایه غیرخالی باشد." });
  if (typeof value !== "number" || (value !== 0 && value !== 1)) return res.status(400).json({ error: "فیلد 'value' باید 0 یا 1 باشد." });

  const validIds = ids.filter(id => typeof id === "number" && id > 0);
  if (!validIds.length) return res.status(400).json({ error: "هیچ شناسهٔ معتبری یافت نشد." });

  try {
    const placeholders = generatePlaceholders(validIds.length);
    const sql = `UPDATE forms SET hasReplied = ? WHERE id IN (${placeholders}) AND deleted = 0`;
    const params = [value, ...validIds];

    const [result] = await pool.execute(sql, params);

    res.json({
      message: `وضعیت پاسخ داده شده ${result.affectedRows} رکورد(ها) با موفقیت به‌روز شد.`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("DB error (PATCH /bulk-update-replied):", err);
    res.status(500).json({ error: "خطا در به‌روزرسانی وضعیت پاسخ داده شده" });
  }
});


export default router;
