import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Youtube, AlertCircle, ExternalLink } from "lucide-react";

interface YouTubeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (markdown: string) => void;
}

type EmbedFormat = "thumbnail" | "iframe";

export function YouTubeModal({
  open,
  onOpenChange,
  onInsert,
}: YouTubeModalProps) {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [embedFormat, setEmbedFormat] = useState<EmbedFormat>("thumbnail");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setUrl("");
      setVideoId("");
      setVideoTitle("");
      setEmbedFormat("thumbnail");
      setError("");
    }
  }, [open]);

  const extractVideoId = (input: string): string | null => {
    const trimmed = input.trim();
    
    // Direct video ID (11 characters, alphanumeric with - and _)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    // Various YouTube URL formats
    const patterns = [
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([a-zA-Z0-9_-]{11})/,
      // Short URL: https://youtu.be/VIDEO_ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      // Embed URL: https://www.youtube.com/embed/VIDEO_ID
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      // Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      // Live URL: https://www.youtube.com/live/VIDEO_ID
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
      // Mobile URL: https://m.youtube.com/watch?v=VIDEO_ID
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError("");

    if (!value.trim()) {
      setVideoId("");
      return;
    }

    const id = extractVideoId(value);
    if (id) {
      setVideoId(id);
    } else {
      setVideoId("");
      setError("Could not extract video ID. Please check the URL.");
    }
  };

  const generateMarkdown = (): string => {
    if (!videoId) return "";

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const title = videoTitle.trim() || "YouTube Video";

    if (embedFormat === "thumbnail") {
      // Clickable thumbnail that links to YouTube
      return `[![${title}](${thumbnailUrl})](${watchUrl})`;
    } else {
      // Iframe embed (requires HTML support in markdown renderer)
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="${title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }
  };

  const handleInsert = () => {
    if (!videoId) {
      setError("Please enter a valid YouTube URL or video ID");
      return;
    }

    const markdown = generateMarkdown();
    onInsert("\n" + markdown + "\n");
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInsert();
    }
  };

  const thumbnailUrl = videoId 
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Insert YouTube Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL or Video ID</Label>
            <Input
              id="youtube-url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://www.youtube.com/watch?v=..."
              className={error ? "border-destructive" : ""}
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Supports: youtube.com/watch, youtu.be, youtube.com/embed, youtube.com/shorts
            </p>
          </div>

          {videoId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="video-title">Video Title (optional)</Label>
                <Input
                  id="video-title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a title for accessibility"
                />
              </div>

              <div className="space-y-2">
                <Label>Embed Format</Label>
                <RadioGroup
                  value={embedFormat}
                  onValueChange={(v) => setEmbedFormat(v as EmbedFormat)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="thumbnail" id="thumbnail" className="mt-1" />
                    <div>
                      <Label htmlFor="thumbnail" className="font-normal cursor-pointer">
                        Clickable Thumbnail (Recommended)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Shows video thumbnail that links to YouTube. Works in all markdown renderers.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="iframe" id="iframe" className="mt-1" />
                    <div>
                      <Label htmlFor="iframe" className="font-normal cursor-pointer">
                        Embedded Player (HTML)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Embeds the player directly. Requires HTML support in markdown.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  <div className="relative aspect-video bg-black">
                    <img
                      src={thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to lower quality thumbnail
                        e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-600 rounded-xl px-4 py-2">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {videoTitle || "YouTube Video"}
                    </span>
                    <a
                      href={`https://www.youtube.com/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Markdown Output</Label>
                <pre className="p-3 rounded-lg bg-muted/50 border text-xs overflow-x-auto font-mono whitespace-pre-wrap break-all">
                  {generateMarkdown()}
                </pre>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!videoId}>
            Insert Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
