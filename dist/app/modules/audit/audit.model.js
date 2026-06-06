"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const audit_interface_1 = require("./audit.interface");
const auditLogSchema = new mongoose_1.Schema({
    action: { type: String, enum: Object.values(audit_interface_1.AuditAction), required: true },
    performedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    targetType: { type: String },
    targetId: { type: mongoose_1.Schema.Types.Mixed },
    details: { type: mongoose_1.Schema.Types.Mixed },
    ip: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
exports.AuditLog = (0, mongoose_1.model)("AuditLog", auditLogSchema);
