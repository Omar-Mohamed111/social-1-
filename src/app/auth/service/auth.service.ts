import { AppError } from "../../../lib/error/AppError";
import userRepository from "../../user/repository/user.repository";
import { LoginDto, RegisterDto } from "../dto/dto";
import bcrypt from "bcrypt";
import { Provider } from "../enum/enum";
import jwt from "jsonwebtoken";
import { env } from "../../../lib/config/env";
import { createHash } from "node:crypto";
import otpService from "../../../lib/utils/otp.service";
import authOtpService from "./auth-otp.service";
import googleAuthService from "./google.auth.service";
import twoFactorService from "./two-factor.service";

export class AuthService {
  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const user = await userRepository.getOne({
      email: registerDto.email,
    });

    if (user) throw new AppError("User already exist", 409);

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const createdUser = await userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    await authOtpService.sendEmailVerificationOtp(createdUser.email);

    // Remove password from response
    const { password, ...safeUser } = createdUser.toObject();

    return safeUser;
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await userRepository.getOne({
      email: loginDto.email,
    });

    if (!user || user.provider !== Provider.LOCAL || !user.password) {
      throw new AppError("Invalid email or password", 401);
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check Email Verification
    if (!user.isEmailVerified) {
      throw new AppError("Please verify your email first", 403);
    }

    // Check Two-Factor Authentication
    if (user.isTwoFactorEnabled) {
      const challengeToken = jwt.sign(
        {
          userId: user._id.toString(),
          purpose: "2fa-login",
        },
        env.jwt.refreshSecret,
        { expiresIn: "5m" },
      );

      return {
        requiresTwoFactor: true,
        challengeToken,
      };
    }

    // Generate Access Token
    const accessToken = jwt.sign(
      { userId: user._id.toString() },
      env.jwt.secret,
      { expiresIn: "15m" },
    );

    // Generate Refresh Token
    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      env.jwt.refreshSecret,
      { expiresIn: "7d" },
    );

    // Hash Refresh Token
    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // Store Refresh Token Hash
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    // Remove password and refreshTokenHash from response
    const { password, refreshTokenHash: _, ...safeUser } = user.toObject();

    return {
      requiresTwoFactor: false,
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    // Verify Refresh Token
    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);

    if (typeof decoded === "string" || typeof decoded.userId !== "string") {
      throw new AppError("Invalid refresh token", 401);
    }

    // Find User
    const user = await userRepository.getOne({
      _id: decoded.userId,
    });

    if (!user || !user.refreshTokenHash) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Hash and compare Refresh Token
    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    if (refreshTokenHash !== user.refreshTokenHash) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Generate new Access Token
    const accessToken = jwt.sign(
      { userId: user._id.toString() },
      env.jwt.secret,
      { expiresIn: "15m" },
    );

    // Generate new Refresh Token
    const newRefreshToken = jwt.sign(
      { userId: user._id.toString() },
      env.jwt.refreshSecret,
      { expiresIn: "7d" },
    );

    // Store new Refresh Token Hash
    user.refreshTokenHash = createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    await user.save();

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    const user = await userRepository.getOne({
      _id: userId,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Remove Refresh Token Hash
    user.refreshTokenHash = undefined;

    await user.save();

    return true;
  }

  async verifyEmailOtp(email: string, otp: string) {
    const isValid = await otpService.verifyOtp(
      `email_verification:${email}`,
      otp,
    );

    if (!isValid) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const user = await userRepository.getOne({ email });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.isEmailVerified = true;
    await user.save();

    await otpService.deleteOtp(`email_verification:${email}`);

    return true;
  }

  async resendEmailVerificationOtp(email: string) {
    const user = await userRepository.getOne({ email });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isEmailVerified) {
      throw new AppError("Email is already verified", 400);
    }

    await authOtpService.sendEmailVerificationOtp(email);

    return true;
  }

  // ========================
  // ========================

  async forgotPassword(email: string) {
    const user = await userRepository.getOne({ email });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isEmailVerified) {
      throw new AppError("Please verify your email first", 403);
    }

    await authOtpService.sendPasswordResetOtp(email);

    return true;
  }

  async verifyPasswordResetOtp(email: string, otp: string) {
    const isValid = await otpService.verifyOtp(`password_reset:${email}`, otp);
    if (!isValid) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    return true;
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const isValid = await otpService.verifyOtp(`password_reset:${email}`, otp);

    if (!isValid) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    const user = await userRepository.getOne({ email });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.refreshTokenHash = undefined;

    await user.save();

    await otpService.deleteOtp(`password_reset:${email}`);

    return true;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await userRepository.getOne({ _id: userId });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.password) {
      throw new AppError("User does not have a password", 400);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new AppError(
        "New password must be different from current password",
        400,
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.refreshTokenHash = undefined;

    await user.save();

    return true;
  }

  // ========================
  // ========================

  async googleLogin(idToken: string) {
    // Verify Google ID Token
    const googleUser = await googleAuthService.verifyIdToken(idToken);

    // Find user by Google ID
    let user = await userRepository.getOne({
      googleId: googleUser.googleId,
    });

    // If user doesn't exist, check by email
    if (!user) {
      user = await userRepository.getOne({
        email: googleUser.email,
      });

      // Link Google account with existing user
      if (user) {
        user.googleId = googleUser.googleId;
        user.isEmailVerified = true;

        await user.save();
      } else {
        // Create new Google user
        user = await userRepository.create({
          userName: googleUser.userName,
          email: googleUser.email,
          googleId: googleUser.googleId,
          provider: Provider.GOOGLE,
          isEmailVerified: true,
        });
      }
    }

    // Generate Access Token
    const accessToken = jwt.sign(
      { userId: user._id.toString() },
      env.jwt.secret,
      { expiresIn: "15m" },
    );

    // Generate Refresh Token
    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      env.jwt.refreshSecret,
      { expiresIn: "7d" },
    );

    // Hash Refresh Token
    user.refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await user.save();

    // Remove sensitive data
    const { password, refreshTokenHash: _, ...safeUser } = user.toObject();

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async setupTwoFactor(userId: string) {
    const user = await userRepository.getOne({
      _id: userId,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isTwoFactorEnabled) {
      throw new AppError("Two-factor authentication is already enabled", 400);
    }

    // Generate a new secret
    const secret = twoFactorService.generateSecret();

    // Generate Authenticator URL
    const otpauthUrl = twoFactorService.generateOtpAuthUrl(user.email, secret);

    // Save secret temporarily
    user.twoFactorSecret = secret;

    await user.save();

    return {
      otpauthUrl,
    };
  }

  async verifyAndEnableTwoFactor(userId: string, token: string) {
    const user = await userRepository.findByIdWithTwoFactorSecret(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isTwoFactorEnabled) {
      throw new AppError("Two-factor authentication is already enabled", 400);
    }

    if (!user.twoFactorSecret) {
      throw new AppError("Please setup two-factor authentication first", 400);
    }

    const isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);

    if (!isValid) {
      throw new AppError("Invalid authentication code", 400);
    }

    user.isTwoFactorEnabled = true;

    await user.save();

    return true;
  }

  async verifyLoginTwoFactor(challengeToken: string, token: string) {
    // Verify challenge token
    let decoded: string | jwt.JwtPayload;

    try {
      decoded = jwt.verify(challengeToken, env.jwt.refreshSecret);
    } catch {
      throw new AppError("Invalid or expired challenge token", 401);
    }

    if (
      typeof decoded === "string" ||
      decoded.purpose !== "2fa-login" ||
      typeof decoded.userId !== "string"
    ) {
      throw new AppError("Invalid challenge token", 401);
    }

    // Find user with 2FA secret
    const user = await userRepository.findByIdWithTwoFactorSecret(
      decoded.userId,
    );

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError("Two-factor authentication is not enabled", 400);
    }

    // Verify OTP
    const isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);

    if (!isValid) {
      throw new AppError("Invalid authentication code", 401);
    }

    // Generate Access Token
    const accessToken = jwt.sign(
      { userId: user._id.toString() },
      env.jwt.secret,
      { expiresIn: "15m" },
    );

    // Generate Refresh Token
    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      env.jwt.refreshSecret,
      { expiresIn: "7d" },
    );

    // Hash Refresh Token
    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    // Remove sensitive fields
    const {
      password,
      refreshTokenHash: _,
      twoFactorSecret,
      ...safeUser
    } = user.toObject();

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async disableTwoFactor(userId: string, token: string) {
    const user = await userRepository.findByIdWithTwoFactorSecret(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError("Two-factor authentication is not enabled", 400);
    }

    const isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);

    if (!isValid) {
      throw new AppError("Invalid authentication code", 401);
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;

    await user.save();

    return true;
  }
}
export default new AuthService();
