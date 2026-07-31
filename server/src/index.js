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
    origin:
      process.env.CLIENT_URL ??
      "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  return res.json({
    project: "EduFlow Agent",
    status: "Running",
    version: "0.4.0",
    network: "Arc Testnet",
    settlementAsset: "USDC",
    walletInfrastructure:
      "Circle Developer-Controlled Wallets",
  });
});

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    service: "EduFlow API",
    network: "Arc Testnet",
    agent: "SkillPay Policy Engine",
    circleConfigured: Boolean(
      process.env.CIRCLE_EXECUTOR_WALLET_ID &&
        process.env.CIRCLE_ENTITY_SECRET,
    ),
    contractConfigured: Boolean(
      process.env.EDUFLOW_CONTRACT_ADDRESS,
    ),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/agreements", agreementRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.use((error, req, res, next) => {
  console.error("EduFlow API error:", error);

  return res
    .status(error.status ?? 500)
    .json({
      success: false,
      error:
        process.env.NODE_ENV === "production"
          ? "Unexpected server error"
          : error.message,
    });
});

app.listen(PORT, () => {
  console.log(
    `EduFlow API running on http://localhost:${PORT}`,
  );
});