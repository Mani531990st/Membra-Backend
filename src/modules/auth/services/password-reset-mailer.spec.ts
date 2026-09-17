import { afterEach, describe, expect, it } from "vitest";

import {
  ConsolePasswordResetMailer,
  createPasswordResetMailer,
  SmtpPasswordResetMailer,
} from "../services/password-reset-mailer";

describe("createPasswordResetMailer", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses console mailer outside production when SMTP is unset", () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    process.env.NODE_ENV = "development";

    expect(createPasswordResetMailer()).toBeInstanceOf(
      ConsolePasswordResetMailer,
    );
  });

  it("uses console mailer in production when SMTP is unset (does not fail boot)", () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    process.env.NODE_ENV = "production";

    expect(createPasswordResetMailer()).toBeInstanceOf(
      ConsolePasswordResetMailer,
    );
  });

  it("returns SMTP mailer when host and from are set", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_FROM = "noreply@example.com";
    process.env.NODE_ENV = "production";

    expect(createPasswordResetMailer()).toBeInstanceOf(SmtpPasswordResetMailer);
  });
});
