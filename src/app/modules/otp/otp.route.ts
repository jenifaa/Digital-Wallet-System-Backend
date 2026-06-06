
import  express  from 'express';
import { OTPController } from './otp.controller';
import { otpRateLimiter } from '../../middlewares/rateLimiter';


const router = express.Router()

router.post("/send", otpRateLimiter, OTPController.sendOTP)
router.post("/verify", otpRateLimiter, OTPController.verifyOTP)

export const OtpRoutes = router;