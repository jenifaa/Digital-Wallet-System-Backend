import { Router } from "express";
import { PaymentController } from "./payment.controller";
// import { checkAuth } from "../../middlewares/checkAuth";
// import { Role } from "../user/user.interface";

const router = Router();

// router.post("/init-payment/:id", PaymentController.initPayment);
router.get("/success", PaymentController.successPayment);
router.post("/success", PaymentController.successPayment);

router.get("/fail", PaymentController.failPayment);
router.post("/fail", PaymentController.failPayment);

router.get("/cancel", PaymentController.cancelPayment);
router.post("/cancel", PaymentController.cancelPayment);
// router.get(
//   "/invoice/:paymentId",
//   checkAuth(...Object.values(Role)),
//   PaymentController.getInvoiceDownloadUrl,
// );

router.post("/validate-payment", PaymentController.validatePayment);
export const PaymentRoutes = router;
