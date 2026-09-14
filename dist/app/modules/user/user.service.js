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
const notification_service_1 = require("../notification/notification.service");
const notification_interface_1 = require("../notification/notification.interface");
const transaction_model_1 = require("../transaction/transaction.model");
const transaction_interface_1 = require("../transaction/transaction.interface");
const notifyAdminsOfAgentRequest = (applicantId) => __awaiter(void 0, void 0, void 0, function* () {
    const admins = yield user_model_1.User.find({
        role: { $in: [user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN] },
        isDeleted: { $ne: true },
    }).select("_id");
    yield Promise.all(admins.map((admin) => notification_service_1.NotificationService.sendToUser({
        title: "New agent request",
        message: "A new agent request has been submitted.",
        recipient: admin._id,
        sender: applicantId,
        type: notification_interface_1.NotificationType.AGENT,
    })));
});
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload, rest = __rest(payload, ["email", "password"]);
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "An account with this email already exists");
    }
    if (rest.phone) {
        const phoneExists = yield user_model_1.User.findOne({ phone: rest.phone });
        if (phoneExists) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "An account with this phone number already exists");
        }
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    const authProvider = {
        provider: "credentials",
        providerId: email,
    };
    const isAgentSignup = rest.role === user_interface_1.Role.AGENT;
    const user = yield user_model_1.User.create(Object.assign(Object.assign({ email, password: hashedPassword, auths: [authProvider] }, rest), (isAgentSignup
        ? {
            role: user_interface_1.Role.AGENT,
            isAgentApproved: false,
            agentStatus: user_interface_1.AgentStatus.PENDING,
            agentStatusHistory: [{ status: user_interface_1.AgentStatus.PENDING, changedAt: new Date() }],
        }
        : {})));
    const wallet = yield wallet_model_1.Wallet.create({
        user: user._id,
    });
    user.wallet = wallet._id;
    yield user.save();
    if (user.email) {
        yield emailService_1.emailService.sendWelcome(user.email, user.name);
    }
    if (isAgentSignup) {
        yield notifyAdminsOfAgentRequest(String(user._id));
    }
    return user;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(user_model_1.User.find().select("-password").populate("wallet", "balance status"), query);
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
    yield notifyAdminsOfAgentRequest(String(user._id));
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
    yield notification_service_1.NotificationService.sendToUser({
        title: "Agent request approved",
        message: "Your agent request has been approved by the administrator.",
        recipient: user._id,
        sender: decodedToken.userId,
        type: notification_interface_1.NotificationType.AGENT,
    });
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
    yield notification_service_1.NotificationService.sendToUser({
        title: "Agent request rejected",
        message: reason
            ? `Your agent request was rejected. Reason: ${reason}`
            : "Your agent request was rejected by the administrator.",
        recipient: user._id,
        sender: decodedToken.userId,
        type: notification_interface_1.NotificationType.AGENT,
    });
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
    yield notification_service_1.NotificationService.sendToUser({
        title: "Agent account suspended",
        message: reason
            ? `Your agent account has been suspended. Reason: ${reason}`
            : "Your agent account has been suspended by the administrator.",
        recipient: user._id,
        sender: decodedToken.userId,
        type: notification_interface_1.NotificationType.AGENT,
    });
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
    yield notification_service_1.NotificationService.sendToUser({
        title: "Agent account restored",
        message: "Your agent account has been restored by the administrator.",
        recipient: user._id,
        sender: decodedToken.userId,
        type: notification_interface_1.NotificationType.AGENT,
    });
    return user;
});
const lookupRecipient = (query, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const term = String(query || "").trim();
    if (term.length < 3) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Enter at least 3 characters to search");
    }
    const users = yield user_model_1.User.find({
        isDeleted: { $ne: true },
        _id: { $ne: currentUserId },
        $or: [
            { phone: { $regex: term, $options: "i" } },
            { email: { $regex: term, $options: "i" } },
        ],
    })
        .select("name email phone isActive role")
        .limit(8);
    return users;
});
const deleteUser = (userId, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (decodedToken.role !== user_interface_1.Role.ADMIN &&
        decodedToken.role !== user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is already deleted");
    }
    if (user.role === user_interface_1.Role.SUPER_ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Super admin cannot be deleted");
    }
    if (String(user._id) === String(decodedToken.userId)) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cannot delete your own account");
    }
    const wallet = yield wallet_model_1.Wallet.findOne({ user: user._id });
    if (wallet && wallet.balance > 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cannot delete a user whose wallet still has a balance");
    }
    const pendingCount = yield transaction_model_1.Transaction.countDocuments({
        $or: [{ sender: user._id }, { receiver: user._id }],
        status: transaction_interface_1.TransactionStatus.PENDING,
    });
    if (pendingCount > 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cannot delete a user with pending transactions");
    }
    user.isDeleted = true;
    user.isActive = user_interface_1.IsActive.INACTIVE;
    yield user.save();
    if (wallet) {
        wallet.isDeleted = true;
        yield wallet.save();
    }
    return null;
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
    deleteUser,
    lookupRecipient,
};
