import { beforeEach, describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/shared/errors";

vi.mock("../services/avatar-image", async () => {
  const actual = await vi.importActual<typeof import("../services/avatar-image")>(
    "../services/avatar-image",
  );
  return {
    ...actual,
    convertAvatarToAvif: vi.fn(),
  };
});

import {
  convertAvatarToAvif,
  detectAvatarFormat,
} from "../services/avatar-image";
import { GetAvatars } from "./get-avatars";
import { UpdateAvatars } from "./update-avatars";

const convertAvatarToAvifMock = vi.mocked(convertAvatarToAvif);

function jpegMagic(): Buffer {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
}

function pngMagic(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
}

function gifMagic(): Buffer {
  return Buffer.from("GIF89a............", "ascii");
}

function webpMagic(): Buffer {
  const buf = Buffer.alloc(12);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(4, 4);
  buf.write("WEBP", 8);
  return buf;
}

describe("avatar-image detection", () => {
  it("detects jpeg, png, and webp from magic bytes", () => {
    expect(detectAvatarFormat(jpegMagic(), "image/jpeg")).toBe("jpeg");
    expect(detectAvatarFormat(pngMagic(), "image/png")).toBe("png");
    expect(detectAvatarFormat(webpMagic(), "image/webp")).toBe("webp");
  });

  it("rejects unsupported types such as GIF", () => {
    expect(() => detectAvatarFormat(gifMagic(), "image/gif")).toThrow(
      ValidationError,
    );
    expect(() => detectAvatarFormat(gifMagic())).toThrow(ValidationError);
  });

  it("rejects empty files", () => {
    expect(() => detectAvatarFormat(Buffer.alloc(0))).toThrow(ValidationError);
  });
});

describe("UpdateAvatars", () => {
  const db = {} as never;
  const avatarsRepository = {
    upsertSlots: vi.fn(),
  };
  const storage = {
    putObject: vi.fn(),
    getSignedGetUrl: vi.fn(),
  };

  const useCase = new UpdateAvatars(
    db,
    avatarsRepository as never,
    storage as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    convertAvatarToAvifMock.mockResolvedValue(Buffer.from("avif-bytes"));
    storage.putObject.mockResolvedValue(undefined);
    storage.getSignedGetUrl.mockImplementation(async (key: string) => {
      return `https://signed.example/${key}`;
    });
    avatarsRepository.upsertSlots.mockResolvedValue({
      avatar1: "users/user-1/avatar1.avif",
      avatar2: null,
      avatar3: null,
    });
  });

  it("rejects when no avatar fields are provided", async () => {
    await expect(useCase.execute("user-1", {})).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(storage.putObject).not.toHaveBeenCalled();
  });

  it("uploads only provided slots", async () => {
    const result = await useCase.execute("user-1", {
      avatar1: {
        buffer: Buffer.from("x"),
        mimetype: "image/jpeg",
        size: 1,
      },
    });

    expect(convertAvatarToAvifMock).toHaveBeenCalledTimes(1);
    expect(storage.putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "users/user-1/avatar1.avif",
        contentType: "image/avif",
      }),
    );
    expect(avatarsRepository.upsertSlots).toHaveBeenCalledWith(db, "user-1", {
      avatar1: "users/user-1/avatar1.avif",
    });
    expect(result.avatar1).toBe(
      "https://signed.example/users/user-1/avatar1.avif",
    );
    expect(result.avatar2).toBeNull();
  });

  it("uploads all three slots when provided", async () => {
    avatarsRepository.upsertSlots.mockResolvedValue({
      avatar1: "users/user-1/avatar1.avif",
      avatar2: "users/user-1/avatar2.avif",
      avatar3: "users/user-1/avatar3.avif",
    });

    const file = {
      buffer: Buffer.from("x"),
      mimetype: "image/png",
      size: 1,
    };
    const result = await useCase.execute("user-1", {
      avatar1: file,
      avatar2: file,
      avatar3: file,
    });

    expect(storage.putObject).toHaveBeenCalledTimes(3);
    expect(avatarsRepository.upsertSlots).toHaveBeenCalledWith(db, "user-1", {
      avatar1: "users/user-1/avatar1.avif",
      avatar2: "users/user-1/avatar2.avif",
      avatar3: "users/user-1/avatar3.avif",
    });
    expect(result).toEqual({
      avatar1: "https://signed.example/users/user-1/avatar1.avif",
      avatar2: "https://signed.example/users/user-1/avatar2.avif",
      avatar3: "https://signed.example/users/user-1/avatar3.avif",
    });
  });
});

describe("GetAvatars", () => {
  const db = {} as never;
  const avatarsRepository = {
    findByUserId: vi.fn(),
  };
  const storage = {
    getSignedGetUrl: vi.fn(async (key: string) => `https://signed.example/${key}`),
  };
  const useCase = new GetAvatars(
    db,
    avatarsRepository as never,
    storage as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns nulls when no row exists", async () => {
    avatarsRepository.findByUserId.mockResolvedValue(null);
    await expect(useCase.execute("user-1")).resolves.toEqual({
      avatar1: null,
      avatar2: null,
      avatar3: null,
    });
    expect(storage.getSignedGetUrl).not.toHaveBeenCalled();
  });

  it("signs only present keys", async () => {
    avatarsRepository.findByUserId.mockResolvedValue({
      avatar1: "users/user-1/avatar1.avif",
      avatar2: null,
      avatar3: "users/user-1/avatar3.avif",
    });

    await expect(useCase.execute("user-1")).resolves.toEqual({
      avatar1: "https://signed.example/users/user-1/avatar1.avif",
      avatar2: null,
      avatar3: "https://signed.example/users/user-1/avatar3.avif",
    });
  });
});

describe("convertAvatarToAvif integration", () => {
  it("converts a real tiny PNG to AVIF", async () => {
    vi.doUnmock("../services/avatar-image");
    const { convertAvatarToAvif: realConvert } = await vi.importActual<
      typeof import("../services/avatar-image")
    >("../services/avatar-image");

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const avif = await realConvert(png, "image/png");
    expect(avif.length).toBeGreaterThan(0);
    expect(avif.toString("ascii", 4, 8)).toBe("ftyp");
  });
});
