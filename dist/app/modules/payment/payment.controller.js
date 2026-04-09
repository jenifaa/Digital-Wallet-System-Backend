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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const payment_service_1 = require("./payment.service");
const env_1 = require("../../config/env");
const sendResponse_1 = require("../../utils/sendResponse");
const sslCommerz_service_1 = require("../sslCommerz/sslCommerz.service");
const successPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const result = yield payment_service_1.PaymentService.successPayment(query);
    res.redirect(`${env_1.envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`);
}));
const failPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const result = yield payment_service_1.PaymentService.failPayment(query);
    res.redirect(`${env_1.envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`);
}));
const cancelPayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const result = yield payment_service_1.PaymentService.cancelPayment(query);
    res.redirect(`${env_1.envVars.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`);
}));
// const getInvoiceDownloadUrl = catchAsync(
//   async (req: Request, res: Response) => {
//     const { paymentId } = req.params;
//     const result = await PaymentService.getInvoiceDownloadUrl(paymentId);
//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: "Invoice url retrieve  successfully",
//       data: result,
//     });
//   },
// );
const validatePayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("SSLCommerz ipn", req.body);
    yield sslCommerz_service_1.SSLService.validatePayment(req.body);
    // IPN is the most reliable post-payment signal; attempt processing idempotently.
    if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.tran_id) {
        yield payment_service_1.PaymentService.successPayment({
            tran_id: String(req.body.tran_id),
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Payment Validated  successfully",
        data: null,
    });
}));
exports.PaymentController = {
    successPayment,
    failPayment,
    cancelPayment,
    // initPayment,
    // getInvoiceDownloadUrl,
    validatePayment,
};
