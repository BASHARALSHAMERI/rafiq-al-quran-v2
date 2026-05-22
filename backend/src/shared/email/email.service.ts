import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../logger/logger";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const emailService = {
  async sendEmail(to: string, subject: string, html: string) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn("SMTP credentials not provided. Email not sent.");
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });

      logger.info({ messageId: info.messageId, to }, "Email sent successfully");
      return info;
    } catch (error) {
      logger.error({ error, to }, "Failed to send email");
      throw error;
    }
  },

  async sendPasswordResetEmail(to: string, fullName: string, resetUrl: string) {
    const subject = "استعادة كلمة المرور - رفقاء القرآن";
    const html = `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #064e3b;">مرحباً ${fullName}</h2>
        <p>لقد طلبت استعادة كلمة المرور الخاصة بك في نظام رفقاء القرآن.</p>
        <p>يرجى الضغط على الزر أدناه لإكمال العملية:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #064e3b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">تعيين كلمة مرور جديدة</a>
        </div>
        <p>إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة بأمان.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 0.8rem; color: #888;">هذه الرسالة آلية، يرجى عدم الرد عليها.</p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  },

  async sendAccountActivationEmail(to: string, fullName: string, activationUrl: string) {
    const subject = "تفعيل حسابك - رفقاء القرآن";
    const html = `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #064e3b;">مرحباً ${fullName}</h2>
        <p>تم إنشاء حساب لك في نظام رفقاء القرآن. يرجى تفعيل حسابك وإعداد كلمة المرور الخاصة بك.</p>
        <p>يرجى الضغط على الزر أدناه لتفعيل الحساب:</p>
        <div style="margin: 30px 0;">
          <a href="${activationUrl}" style="background-color: #064e3b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">تفعيل الحساب</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 0.8rem; color: #888;">هذه الرسالة آلية، يرجى عدم الرد عليها.</p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }
};
