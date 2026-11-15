import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Validate environment variables
const schema = z.object({
  PORT: z.string().default("3000"),
  MONGO_URI: z.string(),
  JWT_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  EMAIL_USER: z.string().trim().toLowerCase(),
  EMAIL_PASS: z.string(),
  REDIS_PORT: z.string().default("6379"),
  REDIS_HOST: z.string(),
  REDIS_PASSWORD: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
});

const parsed = schema.parse(process.env);

export const env = {
  port: Number(parsed.PORT),

  db: {
    url: parsed.MONGO_URI,
  },

  redis: {
    host: parsed.REDIS_HOST,
    port: Number(parsed.REDIS_PORT),
    password: parsed.REDIS_PASSWORD,
  },

  nodemailer: {
    user: parsed.EMAIL_USER,
    pass: parsed.EMAIL_PASS,
  },

  jwt: {
    secret: parsed.JWT_SECRET,
    refreshSecret: parsed.REFRESH_TOKEN_SECRET,
  },

  google: {
    clientId: parsed.GOOGLE_CLIENT_ID,
  },
  payments: {},
  aws: {},
};
