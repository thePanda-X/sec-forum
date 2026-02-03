import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { logger } from "../utils/logger";

// S3 Configuration from environment
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT || "http://localhost:9000";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || process.env.MINIO_ROOT_USER || "minioadmin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || "minioadmin";
const S3_BUCKET = process.env.S3_BUCKET || "secforum-uploads";
const S3_REGION = process.env.S3_REGION || "us-east-1";

// Allowed file types and max size
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Upload types for organizing files
export type UploadType = "avatars" | "posts" | "banners";

// S3 Client instance
export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

/**
 * Initialize S3 bucket with proper configuration
 * Creates the bucket if it doesn't exist and sets up public read policy + CORS
 */
export async function initializeS3Bucket(): Promise<void> {
  try {
    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
      logger.info(`S3 bucket '${S3_BUCKET}' already exists`);
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        // Create bucket
        logger.info(`Creating S3 bucket '${S3_BUCKET}'...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
        logger.info(`S3 bucket '${S3_BUCKET}' created successfully`);
      } else {
        throw error;
      }
    }

    // Set public read policy for the bucket
    const publicReadPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${S3_BUCKET}/*`],
        },
      ],
    };

    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: S3_BUCKET,
        Policy: JSON.stringify(publicReadPolicy),
      })
    );
    logger.info(`S3 bucket '${S3_BUCKET}' public read policy applied`);

    // Set CORS configuration for direct browser uploads
    // Note: This may fail on some S3-compatible services like MinIO
    // In that case, CORS can be configured via the MinIO console or mc command
    try {
      const corsConfiguration = {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedOrigins: ["*"], // In production, restrict to your domain
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      };

      await s3Client.send(
        new PutBucketCorsCommand({
          Bucket: S3_BUCKET,
          CORSConfiguration: corsConfiguration,
        })
      );
      logger.info(`S3 bucket '${S3_BUCKET}' CORS configuration applied`);
    } catch (corsError: any) {
      // CORS configuration may not be supported by all S3-compatible services
      // MinIO handles CORS differently - presigned URLs should still work
      logger.warn(`Could not set CORS configuration (this is OK for MinIO): ${corsError.message || corsError}`);
    }

  } catch (error) {
    logger.error("Failed to initialize S3 bucket:", { error: String(error) });
    throw error;
  }
}

/**
 * Generate a unique file key for uploads
 */
export function generateFileKey(
  type: UploadType,
  userId: number,
  filename: string
): string {
  const uuid = crypto.randomUUID();
  const extension = filename.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  return `${type}/${userId}/${timestamp}-${uuid}.${extension}`;
}

/**
 * Get the content type from filename
 */
export function getContentType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[extension || ""] || "application/octet-stream";
}

/**
 * Validate file type
 */
export function isValidImageType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(contentType);
}

/**
 * Upload a file buffer directly to S3
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
  logger.info(`Uploaded file to S3: ${key}`);
}

/**
 * Get a file from S3
 * Returns the file body as a readable stream and content type
 */
export async function getFile(key: string): Promise<{
  body: ReadableStream | null;
  contentType: string;
  contentLength: number;
}> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  return {
    body: response.Body?.transformToWebStream() || null,
    contentType: response.ContentType || "application/octet-stream",
    contentLength: response.ContentLength || 0,
  };
}

/**
 * Get the proxied public URL for a file (served through backend)
 */
export function getProxiedPublicUrl(key: string): string {
  return `/api/v1/uploads/files/${key}`;
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );
    logger.info(`Deleted file from S3: ${key}`);
  } catch (error) {
    logger.error(`Failed to delete file from S3: ${key}`, { error: String(error) });
    throw error;
  }
}

/**
 * Extract the key from a public URL (supports both direct S3 URLs and proxied URLs)
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    // Handle proxied URLs: /api/v1/uploads/files/type/userId/filename
    if (url.includes('/api/v1/uploads/files/')) {
      const match = url.match(/\/api\/v1\/uploads\/files\/(.+)$/);
      return match ? match[1] : null;
    }
    
    // Handle direct S3 URLs: http://endpoint/bucket/type/userId/filename
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    // URL format: /bucket-name/type/userId/filename
    // We need: type/userId/filename
    if (pathParts.length >= 4) {
      return pathParts.slice(2).join("/");
    }
    return null;
  } catch {
    return null;
  }
}

// Export configuration for use in other modules
export const s3Config = {
  bucket: S3_BUCKET,
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  maxFileSize: MAX_FILE_SIZE,
  allowedTypes: ALLOWED_IMAGE_TYPES,
};
