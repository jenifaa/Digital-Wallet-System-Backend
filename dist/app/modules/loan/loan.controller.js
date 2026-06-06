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
exports.LoanController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const loan_service_1 = require("./loan.service");
const audit_interface_1 = require("../audit/audit.interface");
const audit_service_1 = require("../audit/audit.service");
const requestLoan = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const loan = yield loan_service_1.LoanService.requestLoan(decoded.userId, req.body.amount);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Loan request submitted successfully",
        data: loan,
    });
}));
const getMyLoans = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const result = yield loan_service_1.LoanService.getMyLoans(decoded.userId, req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Loan history retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getAllLoans = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield loan_service_1.LoanService.getAllLoans(req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Loan requests retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const approveLoan = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const loan = yield loan_service_1.LoanService.approveLoan(String(req.params.id), decoded.userId);
    yield audit_service_1.AuditService.logAudit(req, audit_interface_1.AuditAction.LOAN_APPROVE, {
        targetType: "Loan",
        targetId: String(req.params.id),
        performedBy: decoded.userId,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Loan approved and credited to wallet",
        data: loan,
    });
}));
const rejectLoan = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const loan = yield loan_service_1.LoanService.rejectLoan(String(req.params.id), decoded.userId, req.body.reason);
    yield audit_service_1.AuditService.logAudit(req, audit_interface_1.AuditAction.LOAN_REJECT, {
        targetType: "Loan",
        targetId: String(req.params.id),
        performedBy: decoded.userId,
        details: { reason: req.body.reason },
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Loan rejected",
        data: loan,
    });
}));
const repayLoan = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const loan = yield loan_service_1.LoanService.repayLoan(decoded.userId, String(req.params.id), req.body.amount);
    yield audit_service_1.AuditService.logAudit(req, audit_interface_1.AuditAction.LOAN_REPAY, {
        targetType: "Loan",
        targetId: String(req.params.id),
        performedBy: decoded.userId,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Loan repayment recorded",
        data: loan,
    });
}));
exports.LoanController = {
    requestLoan,
    getMyLoans,
    getAllLoans,
    approveLoan,
    rejectLoan,
    repayLoan,
};
