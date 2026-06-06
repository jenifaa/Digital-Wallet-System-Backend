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
exports.emailService = void 0;
const sendEmail_1 = require("./sendEmail");
class EmailService {
    send(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, sendEmail_1.sendEmail)({
                to: payload.to,
                subject: payload.subject,
                templateName: payload.templateName,
                templateData: payload.templateData,
            });
        });
    }
    sendWelcome(to, name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.send({
                to,
                subject: "Welcome to Digital Wallet",
                templateName: "welcome",
                templateData: { name, email: to },
            });
        });
    }
    sendPasswordReset(to, name, resetLink) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.send({
                to,
                subject: "Password Reset",
                templateName: "forgetPassword",
                templateData: { name, resetUILink: resetLink },
            });
        });
    }
    sendOtp(to, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.send({
                to,
                subject: "Your OTP Code",
                templateName: "otp",
                templateData: { otp },
            });
        });
    }
    sendPinReset(to, name, resetLink) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.send({
                to,
                subject: "Wallet PIN Reset",
                templateName: "forgetPin",
                templateData: { name, resetUILink: resetLink },
            });
        });
    }
}
exports.emailService = new EmailService();
