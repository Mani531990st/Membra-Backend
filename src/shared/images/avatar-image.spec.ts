import { describe, expect, it } from "vitest";

import { ValidationError } from "@/shared/errors";

import { detectAvatarFormat } from "./avatar-image";

/** Minimal JPEG SOI + APP0-ish marker bytes so sniffing succeeds. */
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

/** PNG signature. */
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

/** GIF89a — not an allowed avatar format. */
const GIF_BYTES = Buffer.from("GIF89a");

describe("detectAvatarFormat", () => {
  it("accepts JPEG with application/octet-stream (Blob upload)", () => {
    expect(detectAvatarFormat(JPEG_BYTES, "application/octet-stream")).toBe(
      "jpeg",
    );
  });

  it("accepts PNG with binary/octet-stream", () => {
    expect(detectAvatarFormat(PNG_BYTES, "binary/octet-stream")).toBe("png");
  });

  it("accepts JPEG with empty or missing mime", () => {
    expect(detectAvatarFormat(JPEG_BYTES, "")).toBe("jpeg");
    expect(detectAvatarFormat(JPEG_BYTES)).toBe("jpeg");
  });

  it("accepts JPEG with an allowed image mime", () => {
    expect(detectAvatarFormat(JPEG_BYTES, "image/jpeg")).toBe("jpeg");
  });

  it("rejects explicit non-image mime even if bytes look like JPEG", () => {
    expect(() => detectAvatarFormat(JPEG_BYTES, "text/plain")).toThrow(
      ValidationError,
    );
  });

  it("rejects GIF magic bytes", () => {
    expect(() =>
      detectAvatarFormat(GIF_BYTES, "application/octet-stream"),
    ).toThrow(ValidationError);
  });

  it("rejects disallowed image mime such as image/gif", () => {
    expect(() => detectAvatarFormat(GIF_BYTES, "image/gif")).toThrow(
      ValidationError,
    );
  });
});
