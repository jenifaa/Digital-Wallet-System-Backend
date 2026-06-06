import { model, Schema } from "mongoose";
import { AuditAction, IAuditLog } from "./audit.interface";

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, enum: Object.values(AuditAction), required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    targetType: { type: String },
    targetId: { type: Schema.Types.Mixed },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
