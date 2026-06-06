import { sendEmail } from "./sendEmail";

export interface EmailPayload {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, unknown>;
}

class EmailService {
  async send(payload: EmailPayload): Promise<void> {
    await sendEmail({
      to: payload.to,
      subject: payload.subject,
      templateName: payload.templateName,
      templateData: payload.templateData,
    });
  }

  async sendWelcome(to: string, name: string): Promise<void> {
    await this.send({
      to,
      subject: "Welcome to Digital Wallet",
      templateName: "welcome",
      templateData: { name, email: to },
    });
  }

  async sendPasswordReset(to: string, name: string, resetLink: string): Promise<void> {
    await this.send({
      to,
      subject: "Password Reset",
      templateName: "forgetPassword",
      templateData: { name, resetUILink: resetLink },
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.send({
      to,
      subject: "Your OTP Code",
      templateName: "otp",
      templateData: { otp },
    });
  }

  async sendPinReset(to: string, name: string, resetLink: string): Promise<void> {
    await this.send({
      to,
      subject: "Wallet PIN Reset",
      templateName: "forgetPin",
      templateData: { name, resetUILink: resetLink },
    });
  }
}

export const emailService = new EmailService();
