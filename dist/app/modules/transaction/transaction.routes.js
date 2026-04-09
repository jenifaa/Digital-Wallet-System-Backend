"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRoutes = void 0;
const transaction_validation_1 = require("./transaction.validation");
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const transaction_controller_1 = require("./transaction.controller");
const requireWalletPin_1 = require("../../middlewares/requireWalletPin");
const router = express_1.default.Router();
// SSLCommerz callback compatibility (some envs point to /api/transaction/*)
router.get("/success", transaction_controller_1.transactionController.successCallback);
router.post("/success", transaction_controller_1.transactionController.successCallback);
router.get("/fail", transaction_controller_1.transactionController.failCallback);
router.post("/fail", transaction_controller_1.transactionController.failCallback);
router.get("/cancel", transaction_controller_1.transactionController.cancelCallback);
router.post("/cancel", transaction_controller_1.transactionController.cancelCallback);
router.post("/add-money", (0, checkAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), requireWalletPin_1.requireWalletPin, (0, validateRequest_1.validateRequest)(transaction_validation_1.addMoneySchema), transaction_controller_1.transactionController.AddMoney);
// router.post(
//   "/withdraw",
//   auth("user"),
//   validateRequest(withdrawZodSchema),
//   TransactionController.withdraw
// );
router.post("/send-money", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER, user_interface_1.Role.AGENT), requireWalletPin_1.requireWalletPin, (0, validateRequest_1.validateRequest)(transaction_validation_1.sendMoneySchema), transaction_controller_1.transactionController.SendMoney);
// Cash In (Agent → User)
router.post("/cash-in", (0, checkAuth_1.checkAuth)(user_interface_1.Role.AGENT), requireWalletPin_1.requireWalletPin, (0, validateRequest_1.validateRequest)(transaction_validation_1.cashInSchema), transaction_controller_1.transactionController.CashIn);
// Cash Out (Agent → User)
router.post("/cash-out", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER, user_interface_1.Role.AGENT), requireWalletPin_1.requireWalletPin, (0, validateRequest_1.validateRequest)(transaction_validation_1.cashOutSchema), transaction_controller_1.transactionController.CashOut);
// router.get(
//   "/",
//   auth("admin"),
//   TransactionController.getAllTransactions
// );
// Update Transaction Status
// router.patch(
//   "/:id/status",
//   auth("admin"),
//   validateRequest(updateTransactionStatusZodSchema),
//   TransactionController.updateTransactionStatus
// );
exports.TransactionRoutes = router;
