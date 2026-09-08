import { AsyncLocalStorage } from "node:async_hooks";

import type { Request, Response } from "express";

export type RequestContextStore = {
  req: Request;
  res: Response;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestContext(): RequestContextStore {
  const store = requestContext.getStore();
  if (!store) {
    throw new Error("HTTP request context is not available");
  }
  return store;
}
