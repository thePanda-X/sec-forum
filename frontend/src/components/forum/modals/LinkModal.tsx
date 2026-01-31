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
import { Link, ExternalLink } from "lucide-react";

interface LinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (markdown: string) => void;
  selectedText?: string;
}

export function LinkModal({
  open,
  onOpenChange,
  onInsert,
  selectedText = "",
}: LinkModalProps) {
  const [linkText, setLinkText] = useState(selectedText);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    if (open) {
      setLinkText(selectedText);
      setUrl("");
      setUrlError("");
    }
  }, [open, selectedText]);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError("URL is required");
      return false;
    }
    
    // Allow relative URLs, anchors, and common protocols
    if (value.startsWith("/") || value.startsWith("#") || value.startsWith("mailto:")) {
      setUrlError("");
      return true;
    }

    try {
      new URL(value);
      setUrlError("");
      return true;
    } catch {
      // Try adding https:// prefix
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

  const isExternalUrl = (value: string): boolean => {
    if (value.startsWith("/") || value.startsWith("#") || value.startsWith("mailto:")) {
      return false;
    }
    return true;
  };

  const handleInsert = () => {
    if (!validateUrl(url)) return;

    let finalUrl = url.trim();
    
    // Auto-add https:// if no protocol specified
    if (!finalUrl.startsWith("/") && 
        !finalUrl.startsWith("#") && 
        !finalUrl.startsWith("mailto:") &&
        !finalUrl.match(/^https?:\/\//)) {
      finalUrl = `https://${finalUrl}`;
    }

    const text = linkText.trim() || finalUrl;
    const markdown = `[${text}](${finalUrl})`;

    onInsert(markdown);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInsert();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Insert Link
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="link-text">Link Text</Label>
            <Input
              id="link-text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter display text (optional)"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the URL as the link text
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) validateUrl(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className={urlError ? "border-destructive" : ""}
            />
            {urlError && (
              <p className="text-xs text-destructive">{urlError}</p>
            )}
          </div>

          {url && isExternalUrl(url) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-md bg-muted/50">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>External links will open in a new tab with a security warning</span>
            </div>
          )}

          {(linkText || url) && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Preview:</p>
              <code className="text-sm break-all">
                [{linkText || url || "link text"}]({url || "url"})
              </code>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!url.trim()}>
            Insert Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
