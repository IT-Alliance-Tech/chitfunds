const auth = require("./middleware/auth");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const adminAuthRoutes = require("./routes/adminRoutes");
const chitsRoutes = require("./routes/chitsRoutes");
const memberRoutes = require("./routes/memberRoutes");
const paymentRoutes = require("./routes/paymentsRoutes");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const { errorHandler, notFound } = require("./middleware/errorMiddleware");

// Routes
app.use("/api/admin", adminAuthRoutes);
app.use("/api/chit", chitsRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/payment", paymentRoutes);

// Health check
const sendResponse = require("./utils/responseHandler");
app.get("/health", (req, res) => {
  return sendResponse(res, 200, true, "OK", null);
});

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
