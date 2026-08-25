import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./trpc";

/**
 * Shared API application used by local development and the Vercel function.
 * File bytes can be connected to object storage later; this prototype persists
 * the assessment metadata and teacher review trail in the database.
 */
export function createApp() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
