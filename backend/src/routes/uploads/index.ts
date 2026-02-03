import "reflect-metadata";
import { Controller, Post, Delete, Get } from "elysia-decorators";
import {
  generateFileKey,
  getProxiedPublicUrl,
  isValidImageType,
  deleteFile,
  extractKeyFromUrl,
  uploadFile,
  getFile,
  s3Config,
  type UploadType,
} from "../../services/s3";
import { logger } from "../../utils/logger";

@Controller("/uploads")
export class UploadsController {
  @Post("/upload", {
    detail: {
      tags: ["Uploads"],
      summary: "Upload a file through the backend",
      description: "Upload an image file. The backend proxies the upload to S3/MinIO storage.",
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: { type: "string", format: "binary", description: "Image file to upload" },
                type: {
                  type: "string",
                  enum: ["avatars", "posts", "banners"],
                  description: "Upload type for organizing files"
                },
              },
              required: ["file", "type"],
            },
          },
        },
      },
      responses: {
        200: { 
          description: "File uploaded successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  url: { type: "string", description: "Public URL to access the file" },
                  key: { type: "string", description: "S3 key for the file" },
                },
              },
            },
          },
        },
        400: { description: "Invalid request (invalid file type or size)" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async uploadFile({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { file, type } = body;

    // Validate upload type
    if (!["avatars", "posts", "banners"].includes(type)) {
      set.status = 400;
      return { error: "Invalid upload type. Must be 'avatars', 'posts', or 'banners'" };
    }

    // Validate file exists
    if (!file || !(file instanceof File)) {
      set.status = 400;
      return { error: "No file provided" };
    }

    // Validate content type
    if (!isValidImageType(file.type)) {
      set.status = 400;
      return { 
        error: `Invalid file type. Allowed types: ${s3Config.allowedTypes.join(", ")}` 
      };
    }

    // Validate file size
    if (file.size > s3Config.maxFileSize) {
      set.status = 400;
      return { 
        error: `File too large. Maximum size: ${s3Config.maxFileSize / (1024 * 1024)}MB` 
      };
    }

    try {
      // Generate unique file key
      const key = generateFileKey(type as UploadType, currentUser.id, file.name);
      
      // Convert file to buffer and upload to S3
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      await uploadFile(key, buffer, file.type);
      
      // Return the proxied public URL
      const url = getProxiedPublicUrl(key);

      logger.info(`File uploaded by user ${currentUser.id}: ${key}`);

      return {
        url,
        key,
      };
    } catch (error: any) {
      logger.error("Failed to upload file:", { 
        error: String(error),
        message: error.message,
        code: error.code,
        statusCode: error.$metadata?.httpStatusCode,
        userId: currentUser.id,
        fileType: file.type,
        fileSize: file.size
      });
      
      let errorMessage = "Failed to upload file";
      if (error.code === "InvalidAccessKeyId") {
        errorMessage = "S3 access key is invalid. Check S3_ACCESS_KEY environment variable.";
      } else if (error.code === "SignatureDoesNotMatch") {
        errorMessage = "S3 secret key is invalid. Check S3_SECRET_KEY environment variable.";
      } else if (error.code === "NoSuchBucket") {
        errorMessage = `S3 bucket '${s3Config.bucket}' does not exist. Please initialize S3 bucket.`;
      } else if (error.name === "ECONNREFUSED") {
        errorMessage = "Cannot connect to S3 server. Please check if S3_ENDPOINT is correct and S3 server is running.";
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      set.status = 500;
      return { error: errorMessage };
    }
  }

  @Get("/files/*", {
    detail: {
      tags: ["Uploads"],
      summary: "Serve an uploaded file",
      description: "Retrieve and serve a file from S3/MinIO storage. Files are publicly accessible.",
      parameters: [
        {
          name: "*",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "The file key (e.g., avatars/1/123456-uuid.jpg)",
        },
      ],
      responses: {
        200: { description: "File content" },
        404: { description: "File not found" },
      },
    },
  } as any)
  async serveFile({ params, set }: any) {
    // The wildcard path is in params["*"]
    const key = params["*"];

    if (!key) {
      set.status = 400;
      return { error: "Invalid file path" };
    }

    try {
      const { body, contentType, contentLength } = await getFile(key);

      if (!body) {
        set.status = 404;
        return { error: "File not found" };
      }

      // Set appropriate headers
      set.headers["Content-Type"] = contentType;
      set.headers["Content-Length"] = contentLength.toString();
      set.headers["Cache-Control"] = "public, max-age=31536000, immutable"; // Cache for 1 year

      return new Response(body, {
        headers: {
          "Content-Type": contentType,
          "Content-Length": contentLength.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error: any) {
      if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
        set.status = 404;
        return { error: "File not found" };
      }
      logger.error("Failed to serve file:", { error: String(error), key });
      set.status = 500;
      return { error: "Failed to retrieve file" };
    }
  }

  @Delete("/:key", {
    detail: {
      tags: ["Uploads"],
      summary: "Delete an uploaded file",
      description: "Delete a file from S3/MinIO storage",
      parameters: [
        {
          name: "key",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "The S3 key of the file to delete (URL encoded)",
        },
      ],
      responses: {
        200: { description: "File deleted successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden - not your file" },
        404: { description: "File not found" },
      },
    },
  } as any)
  async deleteUpload({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const key = decodeURIComponent(params.key);

    // Verify the file belongs to the user (check if userId is in the key path)
    // Key format: type/userId/timestamp-uuid.ext
    const keyParts = key.split("/");
    if (keyParts.length < 3) {
      set.status = 400;
      return { error: "Invalid file key format" };
    }

    const fileUserId = parseInt(keyParts[1], 10);
    if (fileUserId !== currentUser.id && currentUser.role !== "admin") {
      set.status = 403;
      return { error: "You can only delete your own files" };
    }

    try {
      await deleteFile(key);
      return { message: "File deleted successfully" };
    } catch (error) {
      console.error("Failed to delete file:", error);
      set.status = 500;
      return { error: "Failed to delete file" };
    }
  }

  @Post("/delete-by-url", {
    detail: {
      tags: ["Uploads"],
      summary: "Delete a file by its public URL",
      description: "Delete a file from S3/MinIO storage using its public URL",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                url: { type: "string", description: "Public URL of the file to delete" },
              },
              required: ["url"],
            },
          },
        },
      },
      responses: {
        200: { description: "File deleted successfully" },
        400: { description: "Invalid URL" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden - not your file" },
      },
    },
  } as any)
  async deleteByUrl({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { url } = body;
    const key = extractKeyFromUrl(url);

    if (!key) {
      set.status = 400;
      return { error: "Invalid URL format" };
    }

    // Verify the file belongs to the user
    const keyParts = key.split("/");
    if (keyParts.length < 3) {
      set.status = 400;
      return { error: "Invalid file key format" };
    }

    const fileUserId = parseInt(keyParts[1], 10);
    if (fileUserId !== currentUser.id && currentUser.role !== "admin") {
      set.status = 403;
      return { error: "You can only delete your own files" };
    }

    try {
      await deleteFile(key);
      return { message: "File deleted successfully" };
    } catch (error) {
      console.error("Failed to delete file:", error);
      set.status = 500;
      return { error: "Failed to delete file" };
    }
  }

  @Post("/config", {
    detail: {
      tags: ["Uploads"],
      summary: "Get upload configuration",
      description: "Get the current upload configuration (allowed types, max size, etc.)",
      responses: {
        200: { 
          description: "Upload configuration",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  maxFileSize: { type: "number" },
                  maxFileSizeMB: { type: "number" },
                  allowedTypes: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
  } as any)
  async getConfig() {
    return {
      maxFileSize: s3Config.maxFileSize,
      maxFileSizeMB: s3Config.maxFileSize / (1024 * 1024),
      allowedTypes: s3Config.allowedTypes,
    };
  }
}
