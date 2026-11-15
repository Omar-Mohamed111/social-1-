import express from "express";
import AuthController from "./controller/auth.controller";
import { validate } from "../../lib/middleware/validation.middleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resendVerificationEmailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyLoginTwoFactorSchema,
  verifyPasswordResetOtpSchema,
  verifyTwoFactorSchema,
} from "./validation/auth.validation";
import { authGuard } from "../../lib/authentication/authGuard";
import {
  loginLimiter,
  resendOtpLimiter,
} from "../../lib/middleware/rate-limit-middleware";

export const authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), AuthController.register);

authRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail,
);

authRouter.post(
  "/resend-verification-email",
  resendOtpLimiter,
  validate(resendVerificationEmailSchema),
  AuthController.resendVerificationEmail,
);

authRouter.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  AuthController.login,
);

authRouter.post("/refresh", AuthController.refresh);

authRouter.post("/logout", authGuard, AuthController.logout);

authRouter.get("/me", authGuard, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    data: req.user,
  });
});

authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);

authRouter.post(
  "/verify-reset-otp",
  validate(verifyPasswordResetOtpSchema),
  AuthController.verifyPasswordResetOtp,
);

authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

authRouter.patch(
  "/change-password",
  authGuard,
  validate(changePasswordSchema),
  AuthController.changePassword,
);

authRouter.post(
  "/google",
  validate(googleLoginSchema),
  AuthController.googleLogin,
);

authRouter.post("/2fa/setup", authGuard, AuthController.setupTwoFactor);

authRouter.post(
  "/2fa/verify-setup",
  authGuard,
  validate(verifyTwoFactorSchema),
  AuthController.verifyAndEnableTwoFactor,
);

authRouter.post(
  "/2fa/verify-login",
  validate(verifyLoginTwoFactorSchema),
  AuthController.verifyLoginTwoFactor,
);

authRouter.post(
  "/2fa/disable",
  authGuard,
  validate(verifyTwoFactorSchema),
  AuthController.disableTwoFactor,
);
