import dotenv from "dotenv";

dotenv.config();

const requiredVariables = ["MONGODB_URI", "JWT_SECRET"];

for (const variableName of requiredVariables) {
  if (!process.env[variableName]) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
}

export const env = {
  port: process.env.PORT || "4000",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  reportsDbPath: process.env.REPORTS_DB_PATH || "./data/reports.db",
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL || "http://localhost:5001",
};
