import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle } from "lucide-react";

interface ExternalLinkContextType {
  openExternalLink: (url: string) => void;
}

const ExternalLinkContext = createContext<ExternalLinkContextType | null>(null);

export function useExternalLink() {
  const context = useContext(ExternalLinkContext);
  if (!context) {
    throw new Error("useExternalLink must be used within ExternalLinkProvider");
  }
  return context;
}

interface ExternalLinkProviderProps {
  children: ReactNode;
}

function isExternalUrl(url: string): boolean {
  if (!url) return false;
  
  // Check if it's a relative URL, anchor, or javascript
  if (
    url.startsWith("/") ||
    url.startsWith("#") ||
    url.startsWith("javascript:") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:")
  ) {
    return false;
  }

  try {
    const linkUrl = new URL(url, window.location.origin);
    return linkUrl.origin !== window.location.origin;
  } catch {
    // If URL parsing fails, check if it looks like an external URL
    return url.startsWith("http://") || url.startsWith("https://");
  }
}

function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function ExternalLinkProvider({ children }: ExternalLinkProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const openExternalLink = useCallback((url: string) => {
    setPendingUrl(url);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (pendingUrl) {
      window.open(pendingUrl, "_blank", "noopener,noreferrer");
    }
    setIsOpen(false);
    setPendingUrl(null);
  }, [pendingUrl]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPendingUrl(null);
  }, []);

  // Global click handler for all anchor tags
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Check if it's an external link
      if (isExternalUrl(href)) {
        event.preventDefault();
        event.stopPropagation();
        openExternalLink(href);
      }
    };

    // Use capture phase to intercept before other handlers
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [openExternalLink]);

  return (
    <ExternalLinkContext.Provider value={{ openExternalLink }}>
      {children}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Leaving this site
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are about to visit an external website. Please verify you trust
              this destination before continuing.
            </DialogDescription>
          </DialogHeader>

          {pendingUrl && (
            <div className="py-4">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Destination:</p>
                <p className="text-sm font-medium break-all flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  {getDomainFromUrl(pendingUrl)}
                </p>
                <p className="text-xs text-muted-foreground mt-2 break-all">
                  {pendingUrl}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancel} className="sm:flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="sm:flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Continue to site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ExternalLinkContext.Provider>
  );
}
