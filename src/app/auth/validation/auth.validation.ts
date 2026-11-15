import { z } from "zod";
import { Gender } from "../enum/enum";

export const registerSchema = z.object({
  userName: z.string().trim().min(2).max(20),

  email: z.string().trim().toLowerCase().email(),

  password: z.string().min(8),

  phoneNumber: z.string().optional(),

  gender: z.nativeEnum(Gender).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
});

export const resendVerificationEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const verifyPasswordResetOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
  newPassword: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Google ID Token is required"),
});

export const verifyTwoFactorSchema = z.object({
  token: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/),
});

export const verifyLoginTwoFactorSchema = z.object({
  challengeToken: z.string().min(1, "Challenge token is required"),

  token: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});
    