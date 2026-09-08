export type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export type PasswordResetMailer = {
  sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void>;
};

/**
 * Dev/no-provider adapter. Logs that a reset email would be sent.
 * Includes the reset URL only outside production so local testing works
 * without exposing tokens via the HTTP API.
 */
export class ConsolePasswordResetMailer implements PasswordResetMailer {
  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      console.info(
        "[auth] Password reset email skipped: no production mailer configured.",
        { to: input.to },
      );
      return;
    }

    console.info("[auth] Password reset email (dev console mailer)", {
      to: input.to,
      resetUrl: input.resetUrl,
    });
  }
}

export const passwordResetMailer: PasswordResetMailer =
  new ConsolePasswordResetMailer();
