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
exports.AuditService = exports.logAudit = void 0;
const audit_model_1 = require("./audit.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const createAuditLog = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return audit_model_1.AuditLog.create(payload);
});
const logAudit = (req, action, details) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const performedBy = (details === null || details === void 0 ? void 0 : details.performedBy) || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
    yield createAuditLog({
        action,
        performedBy: performedBy,
        targetType: details === null || details === void 0 ? void 0 : details.targetType,
        targetId: details === null || details === void 0 ? void 0 : details.targetId,
        details: details === null || details === void 0 ? void 0 : details.details,
        ip: req.ip,
    });
});
exports.logAudit = logAudit;
const getAuditLogs = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(audit_model_1.AuditLog.find().populate("performedBy", "name email role"), query);
    const logs = queryBuilder.filter().sort().paginate();
    const [data, meta] = yield Promise.all([logs.build(), queryBuilder.getMeta()]);
    return { data, meta };
});
exports.AuditService = {
    createAuditLog,
    logAudit: exports.logAudit,
    getAuditLogs,
};
