import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSearchableFields } from "./user.constant";
import { IAuthProvider, IUser, Role, AgentStatus } from "./user.interface";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { Wallet } from "../wallet/wallet.model";
import { emailService } from "../../utils/emailService";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";
const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;
  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };
  const user = await User.create({
    email,
    password: hashedPassword,
    auths: [authProvider],
    ...rest,
  });

  const wallet = await Wallet.create({
    user: user._id,
  });

  user.wallet = wallet._id;
  await user.save();

  if (user.email) {
    await emailService.sendWelcome(user.email, user.name);
  }

  return user;
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find().select("-password"), query);
  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .dateRange()
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const searchUsers = async (query: Record<string, string>) => {
  const filter: Record<string, unknown> = { isDeleted: false };

  if (query.email) {
    filter.email = { $regex: query.email, $options: "i" };
  }
  if (query.phone) {
    filter.phone = { $regex: query.phone, $options: "i" };
  }
  if (query.role) {
    filter.role = query.role;
  }
  if (query.isActive) {
    filter.isActive = query.isActive;
  }

  const queryBuilder = new QueryBuilder(
    User.find(filter).select("-password"),
    query,
  );
  const usersData = queryBuilder
    .search(userSearchableFields)
    .dateRange()
    .sort()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
};

const searchAgents = async (query: Record<string, string>) => {
  const filter: Record<string, unknown> = {
    role: Role.AGENT,
    isDeleted: false,
  };

  if (query.agentStatus) {
    filter.agentStatus = query.agentStatus;
  }
  if (query.email) {
    filter.email = { $regex: query.email, $options: "i" };
  }
  if (query.phone) {
    filter.phone = { $regex: query.phone, $options: "i" };
  }

  const queryBuilder = new QueryBuilder(
    User.find(filter).select("-password"),
    query,
  );
  const agentsData = queryBuilder.search(userSearchableFields).dateRange().sort().paginate();

  const [data, meta] = await Promise.all([
    agentsData.build(),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
};
const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");
  return {
    data: user,
  };
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload,
) => {
  if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
    if (userId !== decodedToken.userId) {
      throw new AppError(401, "You are not authorized");
    }
  }

  const ifUserExist = await User.findById(userId);
  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not FOund");
  }

  if (
    decodedToken.role === Role.ADMIN &&
    ifUserExist?.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  if (payload.role) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    returnDocument: "after",
    runValidators: true,
  });

  // if (payload.picture && ifUserExist.picture) {
  //   await deleteImageFromCloudinary(ifUserExist.picture);
  // }

  return newUpdatedUser;
};
const updateUserProfile = async (
  // userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload,
) => {
  // if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
  //   if (userId !== decodedToken.userId) {
  //     throw new AppError(401, "You are not authorized");
  //   }
  // }
  const userId = decodedToken.userId

  const ifUserExist = await User.findById(userId);
  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not FOund");
  }

  if (
    decodedToken.role === Role.ADMIN &&
    ifUserExist?.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  if (payload.role) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  const newUpdatedUserProfile = await User.findByIdAndUpdate(userId, payload, {
    returnDocument: "after",
    runValidators: true,
  });

  if (payload.picture && ifUserExist.picture) {
    await deleteImageFromCloudinary(ifUserExist.picture);
  }

  return newUpdatedUserProfile;
};

const makeAgent = async (userId: string, decodedToken: JwtPayload) => {
  if (
    decodedToken.role !== Role.ADMIN &&
    decodedToken.role !== Role.SUPER_ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role === Role.AGENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "Already an agent");
  }

  if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Admin cannot be converted to agent",
    );
  }

  user.role = Role.AGENT;
  user.isAgentApproved = false;
  user.agentStatus = AgentStatus.PENDING;
  user.agentStatusHistory = [
    ...(user.agentStatusHistory || []),
    { status: AgentStatus.PENDING, changedBy: decodedToken.userId as unknown as import("mongoose").Types.ObjectId, changedAt: new Date() },
  ];

  await user.save();

  return user;
};

const applyForAgent = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  if (user.role === Role.AGENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "Already an agent or application pending");
  }
  if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, "Admins cannot apply for agent role");
  }
  if (user.agentStatus === AgentStatus.PENDING) {
    throw new AppError(httpStatus.BAD_REQUEST, "Agent application already pending");
  }

  user.role = Role.AGENT;
  user.isAgentApproved = false;
  user.agentStatus = AgentStatus.PENDING;
  user.agentStatusHistory = [
    ...(user.agentStatusHistory || []),
    { status: AgentStatus.PENDING, changedAt: new Date() },
  ];

  await user.save();
  return user;
};

const approveAgent = async (userId: string, decodedToken: JwtPayload) => {
  if (
    decodedToken.role !== Role.ADMIN &&
    decodedToken.role !== Role.SUPER_ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  const user = await User.findById(userId);

  if (!user || user.role !== Role.AGENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not an agent");
  }

  user.isAgentApproved = true;
  user.agentStatus = AgentStatus.APPROVED;
  user.agentStatusHistory = [
    ...(user.agentStatusHistory || []),
    {
      status: AgentStatus.APPROVED,
      changedBy: decodedToken.userId as unknown as import("mongoose").Types.ObjectId,
      changedAt: new Date(),
    },
  ];

  await user.save();

  return user;
};

const rejectAgent = async (
  userId: string,
  decodedToken: JwtPayload,
  reason?: string,
) => {
  if (
    decodedToken.role !== Role.ADMIN &&
    decodedToken.role !== Role.SUPER_ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  const user = await User.findById(userId);
  if (!user || user.role !== Role.AGENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not an agent");
  }

  user.isAgentApproved = false;
  user.agentStatus = AgentStatus.REJECTED;
  user.role = Role.USER;
  user.agentStatusHistory = [
    ...(user.agentStatusHistory || []),
    {
      status: AgentStatus.REJECTED,
      changedBy: decodedToken.userId as unknown as import("mongoose").Types.ObjectId,
      reason,
      changedAt: new Date(),
    },
  ];

  await user.save();
  return user;
};

const suspendAgent = async (
  userId: string,
  decodedToken: JwtPayload,
  reason?: string,
) => {
  if (
    decodedToken.role !== Role.ADMIN &&
    decodedToken.role !== Role.SUPER_ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  const user = await User.findById(userId);
  if (!user || user.role !== Role.AGENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not an agent");
  }

  user.isAgentApproved = false;
  user.agentStatus = AgentStatus.SUSPENDED;
  user.agentStatusHistory = [
    ...(user.agentStatusHistory || []),
    {
      status: AgentStatus.SUSPENDED,
      changedBy: decodedToken.userId as unknown as import("mongoose").Types.ObjectId,
      reason,
      changedAt: new Date(),
    },
  ];

  await user.save();
  return user;
};

const reactivateAgent = async (userId: string, decodedToken: JwtPayload) => {
  if (
    decodedToken.role !== Role.ADMIN &&
    decodedToken.role !== Role.SUPER_ADMIN
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }

  const user = await User.findById(userId);
  if (!user || user.role !== Role.AGENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not an agent");
  }

  user.isAgentApproved = true;
  user.agentStatus = AgentStatus.APPROVED;
  user.agentStatusHistory = [
    ...(user.agentStatusHistory || []),
    {
      status: AgentStatus.APPROVED,
      changedBy: decodedToken.userId as unknown as import("mongoose").Types.ObjectId,
      changedAt: new Date(),
    },
  ];

  await user.save();
  return user;
};


const deleteUser = async (
  userId: string,
  decodedToken: JwtPayload
) => {
  if (
    decodedToken.role !== Role.ADMIN &&
    decodedToken.role !== Role.SUPER_ADMIN
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized"
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not found"
    );
  }

  user.isDeleted = true;

  await user.save();

  return null;
};

export const UserServices = {
  createUser,
  getAllUsers,
  searchUsers,
  searchAgents,
  getMe,
  getSingleUser,
  updateUser,
  updateUserProfile,
  makeAgent,
  applyForAgent,
  approveAgent,
  rejectAgent,
  suspendAgent,
  reactivateAgent,
  deleteUser
};
