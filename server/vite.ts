import fs from "node:fs";
import path from "node:path";
import type { Server } from "node:http";
import express, { type Express } from "express";
import { createServer as createViteServer } from "vite";
import viteConfig from "../vite.config";

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { server }, host: true },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (request, response, next) => {
    try {
      const templatePath = path.resolve(import.meta.dirname, "..", "client", "index.html");
      const template = await fs.promises.readFile(templatePath, "utf-8");
      response.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(request.originalUrl, template));
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  app.use(express.static(distPath));
  app.use("*", (_request, response) => response.sendFile(path.resolve(distPath, "index.html")));
}
