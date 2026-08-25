import { createServer } from "node:http";
import { createApp } from "./app";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = createApp();
  const server = createServer(app);
  const port = Number(process.env.PORT ?? 3000);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.listen(port, () => {
    console.log(`Veda AI is running on http://localhost:${port}`);
  });
}

void startServer();
