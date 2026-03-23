const auth = require("./middleware/auth");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");

const adminAuthRoutes = require("./routes/adminRoutes");
const chitsRoutes = require("./routes/chitsRoutes");
const memberRoutes = require("./routes/memberRoutes");
const paymentRoutes = require("./routes/paymentsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const sendResponse = require("./utils/response");

const app = express();

// --------------------
// 🔐 CORS CONFIG
// --------------------
const allowedOrigins = process.env.FRONTEND_URI
  ? process.env.FRONTEND_URI.split(",").map((o) => o.trim())
  : [];

console.log("[CORS] Active Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, curl)
      if (!origin) return callback(null, true);

      console.log(`[CORS] Request from Origin: ${origin}`);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`[CORS] Rejected Origin: ${origin}`);
        return callback(null, false); // Avoid crashing server
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    optionsSuccessStatus: 200,
  })
);

// --------------------
// 🛡️ OTHER MIDDLEWARE
// --------------------
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// --------------------
// 🚀 ROUTES
// --------------------
app.use("/api/admin", adminAuthRoutes);
app.use("/api/chit", chitsRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --------------------
// ❤️ HEALTH CHECK
// --------------------
app.get("/health", (req, res) => {
  return sendResponse(res, 200, "success", "OK", null);
});

// --------------------
// ❌ ERROR HANDLING
// --------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;