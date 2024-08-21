import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import config from "../config";
import indexRouter from "../routes";
import authRouter from "../routes/wanaship/auth";
import userRouter from "../routes/wanaship/users_routes";
import {
  notFoundHandler,
  globalErrorHandler,
} from "../routes/middlewares/errors";
import type { Express } from "express";

export default async function ({ app }: { app: Express }) {
  // Status checkpoints
  app.get("/status", (req, res) => res.sendStatus(200).end());
  app.head("/status", (req, res) => res.sendStatus(200).end());

  // Reveal real origin IP behind reverse proxies
  app.set("trust proxy", false);

  // Middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(morgan(config.logs.morgan));

  // Routes
  app.use(config.app.apiPrefix, indexRouter);
  app.use("/auth", authRouter);
  app.use("/users", userRouter);

  // Error handlers
  app.use(notFoundHandler);
  app.use(globalErrorHandler);
}
