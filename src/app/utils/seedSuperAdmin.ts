import { envVars } from "../config/env";
import { IAuthProvider, IUser, Role } from "../modules/user/user.interface";

import bcryptjs from "bcryptjs";
import { User } from "../modules/user/user.model";
import { Wallet } from "../modules/wallet/wallet.model";
export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await User.findOne({
      email: envVars.SUPER_ADMIN_EMAIL,
    });

    if (isSuperAdminExist) {
      console.log("Super Admin Exist");
      if (!isSuperAdminExist.wallet) {
        const wallet = await Wallet.create({ user: isSuperAdminExist._id });
        isSuperAdminExist.wallet = wallet._id;
        await isSuperAdminExist.save();
      }
      return;
    }

    const hashedPassword = await bcryptjs.hash(
      envVars.SUPER_ADMIN_PASSWORD,
      Number(envVars.BCRYPT_SALT_ROUND),
    );

    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: envVars.SUPER_ADMIN_EMAIL,
    };

    const payload: IUser = {
      name: "Super Admin",
      role: Role.SUPER_ADMIN,
      email: envVars.SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      phone: envVars.SUPER_ADMIN_PHONE,
      isVerified: true,
      auths: [authProvider],
    };
    const superAdmin = await User.create(payload);
    const wallet = await Wallet.create({ user: superAdmin._id });
    superAdmin.wallet = wallet._id;
    await superAdmin.save();
    console.log(superAdmin);
  } catch (error) {
    console.log(error);
  }
};
