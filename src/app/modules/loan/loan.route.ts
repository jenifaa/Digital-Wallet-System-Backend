import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { LoanController } from "./loan.controller";
import {
  rejectLoanSchema,
  repayLoanSchema,
  requestLoanSchema,
} from "./loan.validation";

const router = Router();

router.post(
  "/request",
  checkAuth(Role.USER, Role.AGENT),
  validateRequest(requestLoanSchema),
  LoanController.requestLoan,
);

router.get(
  "/my-loans",
  checkAuth(Role.USER, Role.AGENT),
  LoanController.getMyLoans,
);

router.post(
  "/repay/:id",
  checkAuth(Role.USER, Role.AGENT),
  validateRequest(repayLoanSchema),
  LoanController.repayLoan,
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  LoanController.getAllLoans,
);

router.patch(
  "/approve/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  LoanController.approveLoan,
);

router.patch(
  "/reject/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(rejectLoanSchema),
  LoanController.rejectLoan,
);

export const LoanRoutes = router;
