import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Upload, Link2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (markdown: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export function ImageModal({
  open,
  onOpenChange,
  onInsert,
  onImageUpload,
}: ImageModalProps) {
  const [activeTab, setActiveTab] = useState<"url" | "upload">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab("url");
      setImageUrl("");
      setAltText("");
      setUrlError("");
      setUploadError("");
      setPreviewUrl("");
      setIsUploading(false);
    }
  }, [open]);

  const validateImageUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError("Image URL is required");
      return false;
    }

    try {
      new URL(value);
      setUrlError("");
      return true;
    } catch {
      try {
        new URL(`https://${value}`);
        setUrlError("");
        return true;
      } catch {
        setUrlError("Please enter a valid URL");
        return false;
      }
    }
  };

  const handleInsert = () => {
    const url = previewUrl || imageUrl;
    
    if (!url.trim()) {
      setUrlError("Please provide an image URL or upload a file");
      return;
    }

    if (activeTab === "url" && !validateImageUrl(imageUrl)) {
      return;
    }

    let finalUrl = url.trim();
    if (activeTab === "url" && !finalUrl.match(/^https?:\/\//)) {
      finalUrl = `https://${finalUrl}`;
    }

    const alt = altText.trim() || "image";
    const markdown = `![${alt}](${finalUrl})`;

    onInsert(markdown);
    onOpenChange(false);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!onImageUpload) {
      setUploadError("Image upload is not configured");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError("Image size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const uploadedUrl = await onImageUpload(file);
      setPreviewUrl(uploadedUrl);
      if (!altText) {
        setAltText(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload, altText]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInsert();
    }
  };

  const currentUrl = activeTab === "upload" ? previewUrl : imageUrl;
  const isValidImage = currentUrl && (activeTab === "upload" || !urlError);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Insert Image
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "url" | "upload")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              From URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2" disabled={!onImageUpload}>
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewUrl("");
                  if (urlError) validateImageUrl(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com/image.jpg"
                className={urlError ? "border-destructive" : ""}
                autoFocus
              />
              {urlError && (
                <p className="text-xs text-destructive">{urlError}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                isUploading && "pointer-events-none opacity-50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop an image here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, GIF, WebP (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="alt-text">Alt Text</Label>
            <Input
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the image (for accessibility)"
            />
            <p className="text-xs text-muted-foreground">
              Alternative text helps screen readers describe the image
            </p>
          </div>

          {isValidImage && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg p-2 bg-muted/30">
                <img
                  src={currentUrl}
                  alt={altText || "Preview"}
                  className="max-h-40 max-w-full mx-auto rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="p-2 rounded bg-muted/50 border">
                <code className="text-xs break-all">
                  ![{altText || "image"}]({currentUrl})
                </code>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleInsert} 
            disabled={!currentUrl || isUploading}
          >
            Insert Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
