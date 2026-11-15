import { randomInt } from "node:crypto";
import { cacheProvider } from "../cache/init";

class OtpService {
  generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  async saveOtp(key: string, otp: string): Promise<void> {
    await cacheProvider.set(key, otp, 300);
  }

  async verifyOtp(key: string, otp: string): Promise<boolean> {
    const storedOtp = await cacheProvider.get(key);
    return storedOtp === otp;
  }

  async deleteOtp(key: string): Promise<void> {
    await cacheProvider.del(key);
  }
}

export default new OtpService();
