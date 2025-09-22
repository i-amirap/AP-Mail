import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import contactRouter from "./routes/contact.js";
import emailRouter from "./routes/email.js";
import { testConnection } from "./utils/db.js";

dotenv.config();

const app = express();

/* --------------------------------------------------------------
   1️⃣ تنظیمات پایه
   -------------------------------------------------------------- */
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const BASE_PATH = process.env.BASE_PATH || "";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const EMAIL_ORIGIN = process.env.EMAIL_ORIGIN;

/* --------------------------------------------------------------
   2️⃣ لاگ ساده
   -------------------------------------------------------------- */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/* --------------------------------------------------------------
   3️⃣ CORS عمومی (برای تمام روت‌ها به‌جز ایمیل)
   -------------------------------------------------------------- */
const corsOptions = {
  origin: (origin, callback) => {
    if (FRONTEND_ORIGIN === "*" || !origin) return callback(null, true);
    if (origin === FRONTEND_ORIGIN) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

/* --------------------------------------------------------------
   4️⃣ هدرهای پیش‌فرض (pre‑flight)
   -------------------------------------------------------------- */
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    FRONTEND_ORIGIN === "*" ? "*" : FRONTEND_ORIGIN
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* --------------------------------------------------------------
   5️⃣ Body parser
   -------------------------------------------------------------- */
app.use(express.json());

/* --------------------------------------------------------------
   6️⃣ مسیرهای API
   -------------------------------------------------------------- */
const apiRouter = express.Router();
apiRouter.use("/contact", contactRouter);

/* --------------------------------------------------------------
   7️⃣ روت ایمیل – CORS اختصاصی با EMAIL_ORIGIN
   -------------------------------------------------------------- */
const emailCorsOptions = {
  origin: (origin, callback) => {
    if (EMAIL_ORIGIN === '*') {
      callback(null, '*');
    } else if (EMAIL_ORIGIN) {
      if (origin === EMAIL_ORIGIN) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by EMAIL_ORIGIN'));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["POST", "OPTIONS"],
};

app.use(
  `${BASE_PATH}/api/send-email`,
  cors(emailCorsOptions),
  emailRouter
);

/* --------------------------------------------------------------
   8️⃣ بقیهٔ روت‌ها (contact و …) به‌صورت عمومی
   -------------------------------------------------------------- */
app.use(`${BASE_PATH}/api`, apiRouter);

/* --------------------------------------------------------------
   9️⃣ مسیر تست ساده (در ریشه BASE_PATH)
   -------------------------------------------------------------- */
app.get(BASE_PATH, (req, res) => {
  res.send("<center><h1>Server is Running!</h1></center>");
});

/* --------------------------------------------------------------
   10️⃣ 404 fallback
   -------------------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({ error: "مسیر موردنظر یافت نشد" });
});

/* --------------------------------------------------------------
   11️⃣ راه‌اندازی ایمن سرور
   -------------------------------------------------------------- */
(async () => {
  try {
    await testConnection();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
      console.log(`   Base path = ${BASE_PATH}`);
    });

    server.on("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. Stop any running instance from cPanel and restart.`
        );
      } else {
        console.error("❌ Server error:", err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Failed to start server (DB connection error):", err);
    process.exit(1);
  }
})();
