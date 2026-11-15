import { OAuth2Client } from "google-auth-library";
import { env } from "../../../lib/config/env";

class GoogleAuthService {
  private client = new OAuth2Client(env.google.clientId);

  async verifyIdToken(idToken: string) {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: env.google.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.email_verified) {
      throw new Error("Invalid Google account");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      userName: payload.name || payload.email.split("@")[0],
      picture: payload.picture,
    };
  }
}

export default new GoogleAuthService();
