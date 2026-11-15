import otpService from "../../../lib/utils/otp.service";
import NodemailerProvider from "../../../pkg/email/mail.service";

export class AuthOtpService {
  async sendEmailVerificationOtp(email: string): Promise<void> {
    const otp = otpService.generateOtp();

    const key = `email_verification:${email}`;

    await otpService.deleteOtp(key);
    await otpService.saveOtp(key, otp);

    await NodemailerProvider.sendEmail(
      email,
      "Email Verification",
      `
        <h2>Verify Your Email</h2>
        <p>Your verification code is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `,
    );
  }

  // =========================

  async sendPasswordResetOtp(email: string): Promise<void> {
    const otp = otpService.generateOtp();

    const key = `password_reset:${email}`;

    await otpService.deleteOtp(key);
    await otpService.saveOtp(key, otp);

    await NodemailerProvider.sendEmail(
      email,
      "Password Reset",
      `
        <h2>Reset Your Password</h2>
        <p>Your password reset code is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `,
    );
  }
}

export default new AuthOtpService();
