import "dotenv/config";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module";
import { AppErrorFilter } from "./shared/filters/app-error.filter";
import { getAllowedOrigins } from "./shared/http/origins";
import { requestIdMiddleware } from "./shared/http/request-id.middleware";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  app.set("trust proxy", 1);
  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.useGlobalFilters(new AppErrorFilter());

  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  await app.listen(Number.isFinite(port) ? port : 3000, "0.0.0.0");
}

void bootstrap();
