import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Link,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Image,
  Eye,
  Edit3,
  Code2,
  Table,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseMarkdown } from "@/lib/markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

type ViewMode = "write" | "preview" | "split";

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your post in markdown...",
  className,
  minHeight = "400px",
  onImageUpload,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (viewMode === "preview" || viewMode === "split") {
      setIsRendering(true);
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      renderTimeoutRef.current = setTimeout(async () => {
        const html = await parseMarkdown(value || "");
        setPreviewHtml(html);
        setIsRendering(false);
      }, 150);
    }
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [value, viewMode]);

  const insertMarkdown = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end) || placeholder;
      const newText =
        value.substring(0, start) +
        before +
        selectedText +
        after +
        value.substring(end);

      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      }, 0);
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            insertMarkdown("**", "**", "bold text");
            break;
          case "i":
            e.preventDefault();
            insertMarkdown("_", "_", "italic text");
            break;
          case "k":
            e.preventDefault();
            insertMarkdown("[", "](url)", "link text");
            break;
          case "e":
            e.preventDefault();
            insertMarkdown("`", "`", "code");
            break;
        }
      }
    },
    [insertMarkdown]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (!onImageUpload) return;

      const items = e.clipboardData.items;
      const imageItems = Array.from(items).filter(
        (item) => item.type.indexOf("image") !== -1
      );

      if (imageItems.length === 0) return;

      e.preventDefault();

      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          try {
            const imageUrl = await onImageUpload(file);
            const textarea = textareaRef.current;
            if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const markdownImage = `\n![${file.name}](${imageUrl})\n`;
              const newText =
                value.substring(0, start) + markdownImage + value.substring(end);
              onChange(newText);
            }
          } catch (error) {
            console.error("Failed to upload image:", error);
          }
        }
      }
    },
    [onImageUpload, onChange, value]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!onImageUpload) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      for (const file of imageFiles) {
        try {
          const imageUrl = await onImageUpload(file);
          const textarea = textareaRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const markdownImage = `\n![${file.name}](${imageUrl})\n`;
            const newText =
              value.substring(0, start) + markdownImage + value.substring(end);
            onChange(newText);
          }
        } catch (error) {
          console.error("Failed to upload image:", error);
        }
      }
    },
    [onImageUpload, onChange, value]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const toolbarButtons = [
    { icon: Bold, label: "Bold (Ctrl+B)", action: () => insertMarkdown("**", "**", "bold text") },
    { icon: Italic, label: "Italic (Ctrl+I)", action: () => insertMarkdown("_", "_", "italic text") },
    { icon: Strikethrough, label: "Strikethrough", action: () => insertMarkdown("~~", "~~", "strikethrough") },
    { icon: Code2, label: "Inline Code (Ctrl+E)", action: () => insertMarkdown("`", "`", "code") },
    { icon: List, label: "Bulleted List", action: () => insertMarkdown("- ") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertMarkdown("1. ") },
    { icon: CheckSquare, label: "Task List", action: () => insertMarkdown("- [ ] ") },
    { icon: Heading1, label: "Heading 1", action: () => insertMarkdown("# ") },
    { icon: Heading2, label: "Heading 2", action: () => insertMarkdown("## ") },
    { icon: Heading3, label: "Heading 3", action: () => insertMarkdown("### ") },
    { icon: Link, label: "Link (Ctrl+K)", action: () => insertMarkdown("[", "](url)", "link text") },
    { icon: Image, label: "Image", action: () => insertMarkdown("![", "](url)", "image alt text") },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("> ") },
    { icon: Code, label: "Code Block", action: () => insertMarkdown("```\n", "\n```", "code") },
    { icon: Table, label: "Table", action: () => insertMarkdown("| Header | Header |\n|--------|--------|\n| Cell   | Cell   |") },
    { icon: Minus, label: "Horizontal Rule", action: () => insertMarkdown("\n---\n") },
  ];

  const mainToolbarButtons = toolbarButtons.slice(0, 6);
  const secondaryToolbarButtons = toolbarButtons.slice(6);

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-card", className)}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b px-2 py-1.5 bg-muted/50 gap-2">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-wrap">
          {mainToolbarButtons.map((button) => (
            <Button
              key={button.label}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={button.action}
              title={button.label}
              type="button"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
          <div className="hidden sm:block w-px h-4 bg-border mx-1" />
          {secondaryToolbarButtons.map((button) => (
            <Button
              key={button.label}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0 hidden md:flex"
              onClick={button.action}
              title={button.label}
              type="button"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div className="flex items-center border rounded-md overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("write")}
            className={cn(
              "px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition-colors",
              viewMode === "write"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Edit3 className="h-3 w-3" />
            <span className="hidden sm:inline">Write</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={cn(
              "px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition-colors",
              viewMode === "split"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H1.75ZM3.5 6.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Z" />
            </svg>
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={cn(
              "px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition-colors",
              viewMode === "preview"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Eye className="h-3 w-3" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight }}>
        {(viewMode === "write" || viewMode === "split") && (
          <div className={cn(
            "relative border-r-0 lg:border-r",
            viewMode === "write" && "border-r-0"
          )}>
            <textarea
              ref={textareaRef}
              data-markdown-editor
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder={placeholder}
              className="w-full h-full px-3 py-2 bg-transparent resize-none focus:outline-none text-sm font-mono"
              style={{ minHeight }}
              spellCheck={false}
            />
          </div>
        )}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={cn(
            "relative overflow-auto",
            viewMode === "split" && "border-l"
          )}>
            {viewMode === "split" && isRendering && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Rendering...
                </div>
              </div>
            )}
            <div
              className="markdown-preview px-3 py-2"
              style={{ minHeight }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </div>
      <div className="border-t px-3 py-1.5 bg-muted/30 hidden sm:block">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Styling with <strong>#</strong> headings, <strong>**bold**</strong>, <strong>_italic_</strong>, <strong>`code`</strong>, <strong>```code```</strong>, <strong>&gt;</strong> quotes</span>
          <span className="hidden lg:inline">•</span>
          <span className="hidden lg:inline">Link with <strong>[text](url)</strong></span>
          <span className="hidden lg:inline">•</span>
          <span className="hidden lg:inline">Drag & drop or paste images</span>
          <span className="hidden lg:inline">•</span>
          <span className="hidden lg:inline">Ctrl+B/I/K/E for formatting</span>
        </div>
      </div>
    </div>
  );
}
