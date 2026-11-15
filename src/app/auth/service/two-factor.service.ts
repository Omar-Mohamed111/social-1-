import { authenticator } from "otplib";

class TwoFactorService {
  generateSecret() {
    return authenticator.generateSecret();
  }

  generateOtpAuthUrl(email: string, secret: string) {
    return authenticator.keyuri(
      email,
      "Social App",
      secret,
    );
  }

  verifyToken(token: string, secret: string) {
    return authenticator.verify({
      token,
      secret,
    });
  }
}

export default new TwoFactorService();