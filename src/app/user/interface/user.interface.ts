import { Gender, Provider } from "../../auth/enum/enum";

// shape or contact User
export interface IUser {
  userName: string;
  email: string;
  password?: string;
  provider: Provider;
  gender: Gender;
  phoneNumber?: string;
  refreshTokenHash?: string;
  isEmailVerified: boolean;
  googleId?: string;
  isTwoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}
