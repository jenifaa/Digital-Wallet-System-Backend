"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
// import { checkAuth } from "../../middlewares/checkAuth";
// import { Role } from "../user/user.interface";
const router = (0, express_1.Router)();
// router.post("/init-payment/:id", PaymentController.initPayment);
router.get("/success", payment_controller_1.PaymentController.successPayment);
router.post("/success", payment_controller_1.PaymentController.successPayment);
router.get("/fail", payment_controller_1.PaymentController.failPayment);
router.post("/fail", payment_controller_1.PaymentController.failPayment);
router.get("/cancel", payment_controller_1.PaymentController.cancelPayment);
router.post("/cancel", payment_controller_1.PaymentController.cancelPayment);
// router.get(
//   "/invoice/:paymentId",
//   checkAuth(...Object.values(Role)),
//   PaymentController.getInvoiceDownloadUrl,
// );
router.post("/validate-payment", payment_controller_1.PaymentController.validatePayment);
exports.PaymentRoutes = router;
