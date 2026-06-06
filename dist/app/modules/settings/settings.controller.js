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
exports.SettingsController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const settings_service_1 = require("./settings.service");
const audit_interface_1 = require("../audit/audit.interface");
const audit_service_1 = require("../audit/audit.service");
const getSettings = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const settings = yield settings_service_1.SettingsService.getSettings();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Settings retrieved successfully",
        data: settings,
    });
}));
const updateSettings = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = req.user;
    const settings = yield settings_service_1.SettingsService.updateSettings(req.body, decoded.userId);
    yield audit_service_1.AuditService.logAudit(req, audit_interface_1.AuditAction.SETTINGS_UPDATE, {
        performedBy: decoded.userId,
        details: req.body,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Settings updated successfully",
        data: settings,
    });
}));
exports.SettingsController = {
    getSettings,
    updateSettings,
};
