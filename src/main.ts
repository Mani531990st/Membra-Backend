import "dotenv/config";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";

import { AppModule } from "./app.module";
import { AppErrorFilter } from "./shared/filters/app-error.filter";
import { requestContext } from "./shared/http/request-context";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.use((req: Request, res: Response, next: NextFunction) => {
    requestContext.run({ req, res }, () => next());
  });
  app.useGlobalFilters(new AppErrorFilter());

  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  await app.listen(Number.isFinite(port) ? port : 3000);
}

void bootstrap();
