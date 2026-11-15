import mongoose from "mongoose";
import { createApp } from "./app";
import http from "node:http";
import { mongooseConnect } from "./lib/db/connection";
import { env } from "./lib/config/env";

async function startServer() {
  try {
    await mongooseConnect();

    const app = createApp();
    const server = http.createServer(app);

    server.listen(env.port, () => {
      console.log(`Server is running on port ${env.port} ✅`);
    });

    async function shutdown() {
      console.log("Shutting down server...");

      server.close(async (error) => {
        if (error) {
          console.error("Failed to close server:", error);
          process.exit(1);
        }

        await mongoose.disconnect();
        process.exit(0);
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
