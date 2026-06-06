"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const env_1 = require("../../config/env");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const user_constant_1 = require("./user.constant");
const user_interface_1 = require("./user.interface");
const user_model_1 = require("./user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const wallet_model_1 = require("../wallet/wallet.model");
const emailService_1 = require("../../utils/emailService");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload, rest = __rest(payload, ["email", "password"]);
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User Already Exist");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    const authProvider = {
        provider: "credentials",
        providerId: email,
    };
    const user = yield user_model_1.User.create(Object.assign({ email, password: hashedPassword, auths: [authProvider] }, rest));
    const wallet = yield wallet_model_1.Wallet.create({
        user: user._id,
    });
    user.wallet = wallet._id;
    yield user.save();
    if (user.email) {
        yield emailService_1.emailService.sendWelcome(user.email, user.name);
    }
    return user;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(user_model_1.User.find().select("-password"), query);
    const usersData = queryBuilder
        .filter()
        .search(user_constant_1.userSearchableFields)
        .dateRange()
        .sort()
        .fields()
        .paginate();
    const [data, meta] = yield Promise.all([
        usersData.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const searchUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = { isDeleted: false };
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
    const queryBuilder = new QueryBuilder_1.QueryBuilder(user_model_1.User.find(filter).select("-password"), query);
    const usersData = queryBuilder
        .search(user_constant_1.userSearchableFields)
        .dateRange()
        .sort()
        .paginate();
    const [data, meta] = yield Promise.all([
        usersData.build(),
        queryBuilder.getMeta(),
    ]);
    return { data, meta };
});
const searchAgents = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {
        role: user_interface_1.Role.AGENT,
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
    const queryBuilder = new QueryBuilder_1.QueryBuilder(user_model_1.User.find(filter).select("-password"), query);
    const agentsData = queryBuilder.search(user_constant_1.userSearchableFields).dateRange().sort().paginate();
    const [data, meta] = yield Promise.all([
        agentsData.build(),
        queryBuilder.getMeta(),
    ]);
    return { data, meta };
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    return {
        data: user,
    };
});
const getSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id).select("-password");
    return {
        data: user,
    };
});
const updateUser = (userId, payload, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.AGENT) {
        if (userId !== decodedToken.userId) {
            throw new AppError_1.default(401, "You are not authorized");
        }
    }
    const ifUserExist = yield user_model_1.User.findById(userId);
    if (!ifUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User Not FOund");
    }
    if (decodedToken.role === user_interface_1.Role.ADMIN &&
        (ifUserExist === null || ifUserExist === void 0 ? void 0 : ifUserExist.role) === user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
    }
    if (payload.role) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.AGENT) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
        }
    }
    if (payload.isActive || payload.isDeleted || payload.isVerified) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.AGENT) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
        }
    }
    const newUpdatedUser = yield user_model_1.User.findByIdAndUpdate(userId, payload, {
        returnDocument: "after",
        runValidators: true,
    });
    // if (payload.picture && ifUserExist.picture) {
    //   await deleteImageFromCloudinary(ifUserExist.picture);
    // }
    return newUpdatedUser;
});
const updateUserProfile = (
// userId: string,
payload, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    // if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
    //   if (userId !== decodedToken.userId) {
    //     throw new AppError(401, "You are not authorized");
    //   }
    // }
    const userId = decodedToken.userId;
    const ifUserExist = yield user_model_1.User.findById(userId);
    if (!ifUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User Not FOund");
    }
    if (decodedToken.role === user_interface_1.Role.ADMIN &&
        (ifUserExist === null || ifUserExist === void 0 ? void 0 : ifUserExist.role) === user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
    }
    if (payload.role) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.AGENT) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
        }
    }
    if (payload.isActive || payload.isDeleted || payload.isVerified) {
        if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.AGENT) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
        }
    }
    const newUpdatedUserProfile = yield user_model_1.User.findByIdAndUpdate(userId, payload, {
        returnDocument: "after",
        runValidators: true,
    });
    if (payload.picture && ifUserExist.picture) {
        yield (0, cloudinary_config_1.deleteImageFromCloudinary)(ifUserExist.picture);
    }
    return newUpdatedUserProfile;
});
const makeAgent = (userId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role !== user_interface_1.Role.ADMIN &&
        decodedToken.role !== user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (user.role === user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Already an agent");
    }
    if (user.role === user_interface_1.Role.ADMIN || user.role === user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Admin cannot be converted to agent");
    }
    user.role = user_interface_1.Role.AGENT;
    user.isAgentApproved = false;
    user.agentStatus = user_interface_1.AgentStatus.PENDING;
    user.agentStatusHistory = [
        ...(user.agentStatusHistory || []),
        { status: user_interface_1.AgentStatus.PENDING, changedBy: decodedToken.userId, changedAt: new Date() },
    ];
    yield user.save();
    return user;
});
const applyForAgent = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (user.role === user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Already an agent or application pending");
    }
    if (user.role === user_interface_1.Role.ADMIN || user.role === user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Admins cannot apply for agent role");
    }
    if (user.agentStatus === user_interface_1.AgentStatus.PENDING) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Agent application already pending");
    }
    user.role = user_interface_1.Role.AGENT;
    user.isAgentApproved = false;
    user.agentStatus = user_interface_1.AgentStatus.PENDING;
    user.agentStatusHistory = [
        ...(user.agentStatusHistory || []),
        { status: user_interface_1.AgentStatus.PENDING, changedAt: new Date() },
    ];
    yield user.save();
    return user;
});
const approveAgent = (userId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role !== user_interface_1.Role.ADMIN &&
        decodedToken.role !== user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user || user.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Not an agent");
    }
    user.isAgentApproved = true;
    user.agentStatus = user_interface_1.AgentStatus.APPROVED;
    user.agentStatusHistory = [
        ...(user.agentStatusHistory || []),
        {
            status: user_interface_1.AgentStatus.APPROVED,
            changedBy: decodedToken.userId,
            changedAt: new Date(),
        },
    ];
    yield user.save();
    return user;
});
const rejectAgent = (userId, decodedToken, reason) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role !== user_interface_1.Role.ADMIN &&
        decodedToken.role !== user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user || user.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Not an agent");
    }
    user.isAgentApproved = false;
    user.agentStatus = user_interface_1.AgentStatus.REJECTED;
    user.role = user_interface_1.Role.USER;
    user.agentStatusHistory = [
        ...(user.agentStatusHistory || []),
        {
            status: user_interface_1.AgentStatus.REJECTED,
            changedBy: decodedToken.userId,
            reason,
            changedAt: new Date(),
        },
    ];
    yield user.save();
    return user;
});
const suspendAgent = (userId, decodedToken, reason) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role !== user_interface_1.Role.ADMIN &&
        decodedToken.role !== user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user || user.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Not an agent");
    }
    user.isAgentApproved = false;
    user.agentStatus = user_interface_1.AgentStatus.SUSPENDED;
    user.agentStatusHistory = [
        ...(user.agentStatusHistory || []),
        {
            status: user_interface_1.AgentStatus.SUSPENDED,
            changedBy: decodedToken.userId,
            reason,
            changedAt: new Date(),
        },
    ];
    yield user.save();
    return user;
});
const reactivateAgent = (userId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role !== user_interface_1.Role.ADMIN &&
        decodedToken.role !== user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user || user.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Not an agent");
    }
    user.isAgentApproved = true;
    user.agentStatus = user_interface_1.AgentStatus.APPROVED;
    user.agentStatusHistory = [
        ...(user.agentStatusHistory || []),
        {
            status: user_interface_1.AgentStatus.APPROVED,
            changedBy: decodedToken.userId,
            changedAt: new Date(),
        },
    ];
    yield user.save();
    return user;
});
exports.UserServices = {
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
};
