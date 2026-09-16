import { beforeEach, describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/shared/errors";

vi.mock("../services/avatar-image", async () => {
  const actual = await vi.importActual<typeof import("../services/avatar-image")>(
    "../services/avatar-image",
  );
  return {
    ...actual,
    buildAvatarVariants: vi.fn(),
  };
});

import {
  buildAvatarVariants,
  detectAvatarFormat,
} from "../services/avatar-image";
import { GetAvatars } from "./get-avatars";
import { UpdateAvatars } from "./update-avatars";

const buildAvatarVariantsMock = vi.mocked(buildAvatarVariants);

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
    findByUserId: vi.fn(),
    upsertSlots: vi.fn(),
  };
  const storage = {
    putObject: vi.fn(),
    deleteObject: vi.fn(),
    getSignedGetUrl: vi.fn(),
  };

  const useCase = new UpdateAvatars(
    db,
    avatarsRepository as never,
    storage as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    buildAvatarVariantsMock.mockResolvedValue({
      original: Buffer.from("original-avif"),
      medium: Buffer.from("medium-avif"),
      small: Buffer.from("small-avif"),
    });
    storage.putObject.mockResolvedValue(undefined);
    storage.deleteObject.mockResolvedValue(undefined);
    storage.getSignedGetUrl.mockImplementation(async (key: string) => {
      return `https://signed.example/${key}`;
    });
    avatarsRepository.findByUserId.mockResolvedValue(null);
    avatarsRepository.upsertSlots.mockImplementation(
      async (_db: unknown, userId: string, slots: Record<string, string>) => slots,
    );
  });

  it("rejects when avatar file is missing", async () => {
    await expect(
      useCase.execute("user-1", {
        avatar: { buffer: Buffer.alloc(0), mimetype: "image/png", size: 0 },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(storage.putObject).not.toHaveBeenCalled();
  });

  it("uploads three size variants from one file", async () => {
    const result = await useCase.execute("user-1", {
      avatar: {
        buffer: Buffer.from("image-bytes"),
        mimetype: "image/jpeg",
        size: 11,
      },
    });

    expect(buildAvatarVariantsMock).toHaveBeenCalledTimes(1);
    expect(storage.putObject).toHaveBeenCalledTimes(3);
    expect(storage.deleteObject).not.toHaveBeenCalled();

    const upsertArgs = avatarsRepository.upsertSlots.mock.calls[0] as [
      unknown,
      string,
      { avatar1: string; avatar2: string; avatar3: string },
    ];
    expect(upsertArgs[1]).toBe("user-1");
    expect(upsertArgs[2].avatar1).toMatch(
      /^avatars\/users\/[0-9a-f-]{36}\/1\.avif$/,
    );
    expect(upsertArgs[2].avatar2).toMatch(
      /^avatars\/users\/[0-9a-f-]{36}\/2\.avif$/,
    );
    expect(upsertArgs[2].avatar3).toMatch(
      /^avatars\/users\/[0-9a-f-]{36}\/3\.avif$/,
    );
    expect(result.avatar1).toBe(
      `https://signed.example/${upsertArgs[2].avatar1}`,
    );
    expect(result.avatar2).toBe(
      `https://signed.example/${upsertArgs[2].avatar2}`,
    );
    expect(result.avatar3).toBe(
      `https://signed.example/${upsertArgs[2].avatar3}`,
    );
  });

  it("deletes previous object-storage keys on re-upload", async () => {
    avatarsRepository.findByUserId.mockResolvedValue({
      avatar1: "users/user-1/avatar1-oldrev.avif",
      avatar2: "users/user-1/avatar2-oldrev.avif",
      avatar3: "users/user-1/avatar3-oldrev.avif",
    });

    await useCase.execute("user-1", {
      avatar: {
        buffer: Buffer.from("image-bytes"),
        mimetype: "image/png",
        size: 11,
      },
    });

    expect(storage.deleteObject).toHaveBeenCalledTimes(3);
    expect(storage.deleteObject).toHaveBeenCalledWith(
      "users/user-1/avatar1-oldrev.avif",
    );
    expect(storage.deleteObject).toHaveBeenCalledWith(
      "users/user-1/avatar2-oldrev.avif",
    );
    expect(storage.deleteObject).toHaveBeenCalledWith(
      "users/user-1/avatar3-oldrev.avif",
    );

    const upsertArgs = avatarsRepository.upsertSlots.mock.calls[0] as [
      unknown,
      string,
      { avatar1: string },
    ];
    expect(upsertArgs[2].avatar1).not.toBe(
      "users/user-1/avatar1-oldrev.avif",
    );
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

describe("buildAvatarVariants integration", () => {
  it("builds three AVIF variants from a tiny PNG without enlarging", async () => {
    vi.doUnmock("../services/avatar-image");
    const { buildAvatarVariants: realBuild } = await vi.importActual<
      typeof import("../services/avatar-image")
    >("../services/avatar-image");

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const variants = await realBuild(png, "image/png");
    expect(variants.original.length).toBeGreaterThan(0);
    expect(variants.medium.length).toBeGreaterThan(0);
    expect(variants.small.length).toBeGreaterThan(0);
    expect(variants.original.toString("ascii", 4, 8)).toBe("ftyp");

    const sharp = (await import("sharp")).default;
    const [origMeta, mediumMeta, smallMeta] = await Promise.all([
      sharp(variants.original).metadata(),
      sharp(variants.medium).metadata(),
      sharp(variants.small).metadata(),
    ]);
    expect(origMeta.width).toBe(1);
    expect(mediumMeta.width).toBe(1);
    expect(smallMeta.width).toBe(1);
  });
});
