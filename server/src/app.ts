import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { githubRouter } from "./routes/github.js";
export function createApp(clientDist?: string) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
  app.use(express.json({ limit: "10kb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/github", githubRouter);
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API endpoint not found." }),
  );
  if (clientDist && existsSync(join(clientDist, "index.html"))) {
    app.use(express.static(clientDist));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(join(clientDist, "index.html")),
    );
  }
  return app;
}
