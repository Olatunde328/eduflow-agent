import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    project: "EduFlow Agent",
    status: "Running",
    version: "0.1.0"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "EduFlow API",
    network: "Arc Testnet",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`?? EduFlow API running on http://localhost:${PORT}`);
});
