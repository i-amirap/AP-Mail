import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  dateStrings: true,
});

/**
 * تست اتصال پایگاه‌داده — فراخوانی در هنگام استارت سرور
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ MySQL connected successfully");
  } catch (err) {
    console.error("❌ MySQL connection error:", err.message || err);
    // process.exit(1); // در محیط توسعه ممکن است بخواهید فرایند را متوقف کنید
  }
}

/**
 * helper ساده برای اجرای کوئری‌ها
 * usage: const [rows] = await query('SELECT * FROM forms WHERE id = ?', [id]);
 */
async function query(sql, params = []) {
  return pool.execute(sql, params);
}


export default pool;
export { testConnection, query };
