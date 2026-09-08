import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ZodError } from "zod";

import { ValidationError } from "@/shared/errors";

import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
} from "../schemas/auth.schema";
import { forgotPassword } from "../use-cases/forgot-password";
import { getMe } from "../use-cases/get-me";
import { login } from "../use-cases/login";
import { logout } from "../use-cases/logout";
import { resetPassword } from "../use-cases/reset-password";
import { signup } from "../use-cases/signup";

function validationFromZod(error: ZodError): ValidationError {
  return new ValidationError("Validation failed", error.flatten());
}

@Controller("auth")
export class AuthController {
  @Post("signup")
  @HttpCode(201)
  async signup(@Body() body: unknown) {
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      throw validationFromZod(parsed.error);
    }
    return signup.execute(parsed.data);
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: unknown) {
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      throw validationFromZod(parsed.error);
    }
    return login.execute(parsed.data);
  }

  @Post("logout")
  @HttpCode(200)
  async logout() {
    return logout.execute();
  }

  @Get("me")
  @HttpCode(200)
  async me() {
    return getMe.execute();
  }

  @Post("forgot-password")
  @HttpCode(200)
  async forgotPassword(@Body() body: unknown) {
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw validationFromZod(parsed.error);
    }
    return forgotPassword.execute(parsed.data);
  }

  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body() body: unknown) {
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw validationFromZod(parsed.error);
    }
    return resetPassword.execute(parsed.data);
  }
}
