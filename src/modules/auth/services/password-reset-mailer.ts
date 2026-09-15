import { Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";

export type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export type PasswordResetMailer = {
  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
};

export const PASSWORD_RESET_MAILER = Symbol("PASSWORD_RESET_MAILER");

/**
 * Fallback when SMTP is unset. Logs that a reset email would be sent.
 * Includes the reset URL only outside production so local testing works
 * without exposing tokens in production container logs.
 */
export class ConsolePasswordResetMailer implements PasswordResetMailer {
  private readonly logger = new Logger(ConsolePasswordResetMailer.name);

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    const isProduction = process.env.NODE_ENV === "production";
    this.logger.log({
      msg: "Password reset email (console mailer; SMTP not configured)",
      to: input.to,
      ...(isProduction ? {} : { resetUrl: input.resetUrl }),
    });
  }
}

export class SmtpPasswordResetMailer implements PasswordResetMailer {
  constructor(
    private readonly transporter: Transporter,
    private readonly from: string,
  ) {}

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: "Reset your Membra password",
      text: `Reset your password using this link:\n${input.resetUrl}\n`,
    });
  }
}

export function createPasswordResetMailer(): PasswordResetMailer {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim();

  if (host && from) {
    const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS;
    const transporter = nodemailer.createTransport({
      host,
      port: Number.isFinite(port) ? port : 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: user ? { user, pass: pass ?? "" } : undefined,
    });
    return new SmtpPasswordResetMailer(transporter, from);
  }

  if (process.env.NODE_ENV === "production") {
    new Logger("PasswordResetMailer").warn(
      "SMTP_HOST/SMTP_FROM unset; using console mailer. Password-reset emails will not be delivered.",
    );
  }

  return new ConsolePasswordResetMailer();
}
