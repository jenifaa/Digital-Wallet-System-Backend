"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRoutes = void 0;
const express_1 = __importDefault(require("express"));
const wallet_controller_1 = require("./wallet.controller");
const user_interface_1 = require("../user/user.interface");
const checkAuth_1 = require("../../middlewares/checkAuth");
const router = express_1.default.Router();
router.get("/me", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), wallet_controller_1.WalletController.getMyWallet);
router.get("/all-wallet", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletController.getAllWallets);
router.patch("/block/:id", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletController.blockWallet);
router.patch("/unblock/:id", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletController.unblockWallet);
router.post("/pin/set", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), wallet_controller_1.WalletController.setPin);
router.post("/pin/forgot", wallet_controller_1.WalletController.forgetPin);
router.post("/pin/reset", wallet_controller_1.WalletController.resetPin);
exports.WalletRoutes = router;
