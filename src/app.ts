import express from "express";
import { router } from "./route";
import { errorHandler } from "./lib/error/error.handler";
import cookieParser from "cookie-parser";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", router);

  app.use(errorHandler);
  return app;
}
