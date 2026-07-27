import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import agreementRoutes from "./routes/agreements.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    project: "EduFlow Agent",
    status: "Running",
    version: "0.2.0"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "EduFlow API",
    network: "Arc Testnet",
    agent: "SkillPay Policy Engine",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/agreements", agreementRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Unexpected server error"
        : error.message
  });
});

app.listen(PORT, () => {
  console.log(`EduFlow API running on http://localhost:${PORT}`);
});
