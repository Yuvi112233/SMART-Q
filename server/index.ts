import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { connectDB } from "./db";
import dotenv from "dotenv";
import { errorHandler } from "./errorHandler";
import path from "path";
import { fileURLToPath } from "url";

// Needed for serving static in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
let isMongoConnected = false;
connectDB()
  .then(() => {
    isMongoConnected = true;
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    console.log("⚠️ Continuing with in-memory storage for development...");
  });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathName.startsWith("/api")) {
      let logLine = `${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Custom error handler
  app.use(errorHandler);

  const env = app.get("env") || "development";

  if (env === "development") {
    // Vite dev server for local dev
    await setupVite(app, server);
  } else {
    // ✅ Serve frontend build in production
    // NOTE: server runs from dist/server.js, so frontend dist is one level up
    const clientDistPath = path.resolve(__dirname, "../public");

    app.use(express.static(clientDistPath));

    // Fallback for React Router
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  // Listen on Render’s port
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`🚀 Serving on port ${port}`);
    }
  );
})();
