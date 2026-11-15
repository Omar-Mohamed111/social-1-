import { AppError } from "../error/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { NextFunction, Request, Response } from "express";

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      throw new AppError("No token provided", 401);
    }

    req.user = jwt.verify(token, env.jwt.secret) as JwtPayload;

    next();
  } catch (error) {
    next(error);
  }
};
