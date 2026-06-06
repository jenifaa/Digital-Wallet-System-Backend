import { Request } from "express";
import { AuditAction, IAuditLog } from "./audit.interface";
import { AuditLog } from "./audit.model";
import { QueryBuilder } from "../../utils/QueryBuilder";

const createAuditLog = async (payload: Partial<IAuditLog>) => {
  return AuditLog.create(payload);
};

export const logAudit = async (
  req: Request,
  action: AuditAction,
  details?: {
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    performedBy?: string;
  },
) => {
  const performedBy = details?.performedBy || (req.user as { userId?: string })?.userId;

  await createAuditLog({
    action,
    performedBy: performedBy as IAuditLog["performedBy"],
    targetType: details?.targetType,
    targetId: details?.targetId,
    details: details?.details,
    ip: req.ip,
  });
};

const getAuditLogs = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(AuditLog.find().populate("performedBy", "name email role"), query);
  const logs = queryBuilder.filter().sort().paginate();
  const [data, meta] = await Promise.all([logs.build(), queryBuilder.getMeta()]);
  return { data, meta };
};

export const AuditService = {
  createAuditLog,
  logAudit,
  getAuditLogs,
};
