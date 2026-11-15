import rateLimit from "express-rate-limit";

export const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    return req.body.email.trim().toLowerCase();
  },

  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});
