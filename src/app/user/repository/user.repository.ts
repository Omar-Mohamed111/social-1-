import { IUser } from "../interface/user.interface";
import { User } from "../model/user.model";
import { AbstractRepository } from "../../../lib/db/abstract.repository";

// T >> IUser
// model >> User

class UserRepository extends AbstractRepository<IUser> {
  constructor() {
    super(User); // make model = User
  }

  async findByEmail(email: string) {
    return User.findOne({ email: email });
  }

  async findByIdWithTwoFactorSecret(userId: string) {
    return User.findById(userId).select("+twoFactorSecret");
  }
}


export default new UserRepository();
