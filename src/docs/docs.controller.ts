import { Controller, Get, Header, NotFoundException, Res } from "@nestjs/common";
import type { Response } from "express";

import { generateOpenApiDocument, isApiDocsEnabled } from "./openapi";
import { swaggerUiHtml } from "./swagger-ui";

@Controller()
export class DocsController {
  @Get("openapi.json")
  getOpenApiJson() {
    if (!isApiDocsEnabled()) {
      throw new NotFoundException({ error: "Not found" });
    }
    return generateOpenApiDocument();
  }

  @Get("docs")
  @Header("Content-Type", "text/html; charset=utf-8")
  getDocs(@Res() res: Response): void {
    if (!isApiDocsEnabled()) {
      res.status(404).send("Not found");
      return;
    }
    res.status(200).send(swaggerUiHtml());
  }
}
