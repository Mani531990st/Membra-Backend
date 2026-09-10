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
 * Dev/no-provider adapter. Logs that a reset email would be sent.
 * Includes the reset URL only outside production so local testing works
 * without exposing tokens via the HTTP API.
 */
export class ConsolePasswordResetMailer implements PasswordResetMailer {
  private readonly logger = new Logger(ConsolePasswordResetMailer.name);

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    this.logger.log({
      msg: "Password reset email (dev console mailer)",
      to: input.to,
      resetUrl: input.resetUrl,
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
  const isProduction = process.env.NODE_ENV === "production";

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

  if (isProduction) {
    throw new Error(
      "SMTP_HOST and SMTP_FROM are required in production. Refusing to boot with the console mailer.",
    );
  }

  return new ConsolePasswordResetMailer();
}
