import { NextFunction, Request, Response } from "express";
import authService, { AuthService } from "../service/auth.service";

class AuthController {
  private authService: AuthService = authService;

  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
        
      const user = await this.authService.register(req.body);
      res.status(201).json({
        message: "User created successfully",
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, otp } = req.body;

      await this.authService.verifyEmailOtp(email, otp);

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);

      if (result.requiresTwoFactor) {
        res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: "Two-factor authentication required",
          data: {
            challengeToken: result.challengeToken,
          },
        });
        return;
      }

      const { user, accessToken, refreshToken } = result;

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
      };

      res.cookie("access_token", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refresh_token", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Login successful",
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refresh_token;

      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refresh(refreshToken);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
      };

      res.cookie("access_token", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refresh_token", newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Tokens refreshed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.authService.logout(req.user!.userId);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
      };

      res.clearCookie("access_token", cookieOptions);
      res.clearCookie("refresh_token", cookieOptions);

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  };

  resendVerificationEmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email } = req.body;

      await this.authService.resendEmailVerificationOtp(email);

      res.status(200).json({
        success: true,
        message: "Verification email sent successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.authService.forgotPassword(req.body.email);

      res.status(200).json({
        success: true,
        message: "Password reset OTP sent successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  verifyPasswordResetOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, otp } = req.body;

      await this.authService.verifyPasswordResetOtp(email, otp);

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, otp, newPassword } = req.body;

      await this.authService.resetPassword(email, otp, newPassword);

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      await this.authService.changePassword(
        req.user!.userId,
        currentPassword,
        newPassword,
      );

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  googleLogin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { idToken } = req.body;

      const result = await this.authService.googleLogin(idToken);

      res.cookie("access_token", result.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Google login successful",
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  setupTwoFactor = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.setupTwoFactor(req.user!.userId);

      res.status(200).json({
        success: true,
        message: "Two-factor authentication setup initiated",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyAndEnableTwoFactor = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.authService.verifyAndEnableTwoFactor(
        req.user!.userId,
        req.body.token,
      );

      res.status(200).json({
        success: true,
        message: "Two-factor authentication enabled successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  verifyLoginTwoFactor = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { user, accessToken, refreshToken } =
        await this.authService.verifyLoginTwoFactor(
          req.body.challengeToken,
          req.body.token,
        );

      res.cookie("access_token", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  disableTwoFactor = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.authService.disableTwoFactor(req.user!.userId, req.body.token);

      res.status(200).json({
        success: true,
        message: "Two-factor authentication disabled successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
