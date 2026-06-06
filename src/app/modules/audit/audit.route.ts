import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuditService } from "./audit.service";
import httpStatus from "http-status-codes";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  catchAsync(async (req, res) => {
    const result = await AuditService.getAuditLogs(req.query as Record<string, string>);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Audit logs retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }),
);

export const AuditRoutes = router;
