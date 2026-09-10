import { Injectable, Logger } from "@nestjs/common";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type ScalewayObjectStorageConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint: string;
  bucket: string;
  signedUrlExpiresInSeconds: number;
};

export const SCALEWAY_OBJECT_STORAGE = Symbol("SCALEWAY_OBJECT_STORAGE");

const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600;

@Injectable()
export class ScalewayObjectStorage {
  private readonly logger = new Logger(ScalewayObjectStorage.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly signedUrlExpiresInSeconds: number;

  constructor(config: ScalewayObjectStorageConfig) {
    this.bucket = config.bucket;
    this.signedUrlExpiresInSeconds = config.signedUrlExpiresInSeconds;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async putObject(input: {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl ?? "private, max-age=3600",
        StorageClass: "STANDARD",
      }),
    );
    this.logger.debug(`Uploaded object ${input.key}`);
  }

  async getSignedGetUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: this.signedUrlExpiresInSeconds },
    );
  }
}

export function createScalewayObjectStorage(): ScalewayObjectStorage {
  const accessKeyId = process.env.SCW_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.SCW_SECRET_KEY?.trim();
  const region = process.env.SCW_DEFAULT_REGION?.trim() || "nl-ams";
  const endpoint =
    process.env.SCW_S3_ENDPOINT?.trim() || `https://s3.${region}.scw.cloud`;
  const bucket = process.env.SCW_S3_BUCKET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!accessKeyId || !secretAccessKey || !bucket) {
    if (isProduction) {
      throw new Error(
        "SCW_ACCESS_KEY, SCW_SECRET_KEY, and SCW_S3_BUCKET are required in production.",
      );
    }
    // Dev still needs real credentials to exercise avatar uploads against Scaleway.
    throw new Error(
      "SCW_ACCESS_KEY, SCW_SECRET_KEY, and SCW_S3_BUCKET must be set to use avatar storage.",
    );
  }

  return new ScalewayObjectStorage({
    accessKeyId,
    secretAccessKey,
    region,
    endpoint,
    bucket,
    signedUrlExpiresInSeconds: DEFAULT_SIGNED_URL_TTL_SECONDS,
  });
}
