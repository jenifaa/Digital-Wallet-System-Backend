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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserAndWalletForTransaction = exports.assertAgentCanOperate = exports.assertWalletCanTransact = exports.assertUserCanTransact = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const user_interface_1 = require("../modules/user/user.interface");
const wallet_interface_1 = require("../modules/wallet/wallet.interface");
const user_model_1 = require("../modules/user/user.model");
const wallet_model_1 = require("../modules/wallet/wallet.model");
const user_interface_2 = require("../modules/user/user.interface");
const assertUserCanTransact = (user) => {
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "User account is deleted");
    }
    if (user.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "User account is blocked");
    }
    if (user.isActive === user_interface_1.IsActive.INACTIVE) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "User account is deactivated");
    }
};
exports.assertUserCanTransact = assertUserCanTransact;
const assertWalletCanTransact = (wallet, action = "send") => {
    if (wallet.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Wallet is deleted");
    }
    if (wallet.status === wallet_interface_1.WalletStatus.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, `Wallet is blocked and cannot ${action}`);
    }
    if (wallet.status === wallet_interface_1.WalletStatus.SUSPENDED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, `Wallet is suspended and cannot ${action}`);
    }
};
exports.assertWalletCanTransact = assertWalletCanTransact;
const assertAgentCanOperate = (user) => {
    if (user.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is not an agent");
    }
    if (user.agentStatus === user_interface_2.AgentStatus.SUSPENDED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent account is suspended");
    }
    if (user.agentStatus === user_interface_2.AgentStatus.REJECTED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent application was rejected");
    }
    if (!user.isAgentApproved || user.agentStatus !== user_interface_2.AgentStatus.APPROVED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent is not approved yet");
    }
};
exports.assertAgentCanOperate = assertAgentCanOperate;
const validateUserAndWalletForTransaction = (userId, options) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("isActive isDeleted role isAgentApproved agentStatus");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    (0, exports.assertUserCanTransact)(user);
    const wallet = yield wallet_model_1.Wallet.findOne({ user: userId }).select("status isDeleted balance");
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    }
    (0, exports.assertWalletCanTransact)(wallet, "send");
    if ((options === null || options === void 0 ? void 0 : options.requireReceive) && options.targetUserId) {
        const receiver = yield user_model_1.User.findById(options.targetUserId).select("isActive isDeleted");
        if (!receiver) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Receiver not found");
        }
        (0, exports.assertUserCanTransact)(receiver);
        const receiverWallet = yield wallet_model_1.Wallet.findOne({ user: options.targetUserId }).select("status isDeleted");
        if (!receiverWallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Receiver wallet not found");
        }
        (0, exports.assertWalletCanTransact)(receiverWallet, "receive");
    }
    return { user, wallet };
});
exports.validateUserAndWalletForTransaction = validateUserAndWalletForTransaction;
