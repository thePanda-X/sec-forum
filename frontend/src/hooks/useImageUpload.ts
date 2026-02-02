import { useState, useCallback } from 'react';

const API_BASE = '/api/v1';

type UploadType = 'avatars' | 'posts';

interface UploadConfig {
  maxFileSize: number;
  maxFileSizeMB: number;
  allowedTypes: string[];
}

interface UploadResponse {
  url: string;
  key: string;
}

interface UseImageUploadReturn {
  uploadImage: (file: File, type: UploadType) => Promise<string>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  config: UploadConfig | null;
}

const defaultConfig: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFileSizeMB: 10,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

/**
 * Hook for uploading images through the backend proxy
 * Files are uploaded to the backend, which stores them in S3/MinIO
 */
export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [config] = useState<UploadConfig>(defaultConfig);

  const uploadImage = useCallback(async (file: File, type: UploadType): Promise<string> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validate file type
      if (!config.allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${config.allowedTypes.join(', ')}`);
      }

      // Validate file size
      if (file.size > config.maxFileSize) {
        throw new Error(`File too large. Maximum size: ${config.maxFileSizeMB}MB`);
      }

      setProgress(10);

      // Create form data with the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      setProgress(30);

      // Upload to backend
      const response = await fetch(`${API_BASE}/uploads/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const { url }: UploadResponse = await response.json();
      setProgress(100);
      
      return url;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [config]);

  return {
    uploadImage,
    isUploading,
    progress,
    error,
    config,
  };
}

/**
 * Create an image upload function for use with MarkdownEditor
 * This is a convenience wrapper that returns just the upload function
 */
export function createImageUploader(type: UploadType = 'posts'): (file: File) => Promise<string> {
  return async (file: File): Promise<string> => {
    const config = defaultConfig;

    // Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${config.allowedTypes.join(', ')}`);
    }

    // Validate file size
    if (file.size > config.maxFileSize) {
      throw new Error(`File too large. Maximum size: ${config.maxFileSizeMB}MB`);
    }

    // Create form data with the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Upload to backend
    const response = await fetch(`${API_BASE}/uploads/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }

    const { url }: UploadResponse = await response.json();
    return url;
  };
}
