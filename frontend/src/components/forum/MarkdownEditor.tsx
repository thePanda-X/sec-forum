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
  MoreHorizontal,
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
  const [showMoreTools, setShowMoreTools] = useState(false);
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

  const formatGroups = {
    text: [
      { icon: Bold, label: "Bold (Ctrl+B)", action: () => insertMarkdown("**", "**", "bold text") },
      { icon: Italic, label: "Italic (Ctrl+I)", action: () => insertMarkdown("_", "_", "italic text") },
      { icon: Strikethrough, label: "Strikethrough", action: () => insertMarkdown("~~", "~~", "strikethrough") },
      { icon: Code2, label: "Inline Code (Ctrl+E)", action: () => insertMarkdown("`", "`", "code") },
    ],
    structure: [
      { icon: Heading1, label: "Heading 1", action: () => insertMarkdown("# ") },
      { icon: Heading2, label: "Heading 2", action: () => insertMarkdown("## ") },
      { icon: Heading3, label: "Heading 3", action: () => insertMarkdown("### ") },
      { icon: Quote, label: "Quote", action: () => insertMarkdown("> ") },
    ],
    lists: [
      { icon: List, label: "Bulleted List", action: () => insertMarkdown("- ") },
      { icon: ListOrdered, label: "Numbered List", action: () => insertMarkdown("1. ") },
      { icon: CheckSquare, label: "Task List", action: () => insertMarkdown("- [ ] ") },
    ],
    insert: [
      { icon: Link, label: "Link (Ctrl+K)", action: () => insertMarkdown("[", "](url)", "link text") },
      { icon: Image, label: "Image", action: () => insertMarkdown("![", "](url)", "image alt text") },
      { icon: Code, label: "Code Block", action: () => insertMarkdown("```\n", "\n```", "code") },
      { icon: Table, label: "Table", action: () => insertMarkdown("| Header | Header |\n|--------|--------|\n| Cell   | Cell   |") },
      { icon: Minus, label: "Horizontal Rule", action: () => insertMarkdown("\n---\n") },
    ],
  };

  const visibleButtons = showMoreTools 
    ? [...formatGroups.text, ...formatGroups.structure, ...formatGroups.lists, ...formatGroups.insert]
    : formatGroups.text;

  return (
    <div className={cn("border rounded-xl overflow-hidden bg-card shadow-sm", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-1 flex-wrap">
          {visibleButtons.map((button, idx) => (
            <Button
              key={button.label}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-md hover:bg-accent"
              onClick={button.action}
              title={button.label}
              type="button"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0 rounded-md hover:bg-accent", showMoreTools && "bg-accent")}
            onClick={() => setShowMoreTools(!showMoreTools)}
            title="More formatting"
            type="button"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center bg-muted rounded-lg p-1 border">
          <button
            type="button"
            onClick={() => setViewMode("write")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-md transition-all",
              viewMode === "write"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Write</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-md transition-all",
              viewMode === "split"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H1.75ZM3.5 6.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Z" />
            </svg>
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-md transition-all",
              viewMode === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>
      <div 
        className="grid grid-cols-1 lg:grid-cols-2" 
        style={{ minHeight }}
      >
        {(viewMode === "write" || viewMode === "split") && (
          <div className={cn(
            "relative border-r border-border",
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
              className="w-full h-full px-4 py-3 bg-transparent resize-none focus:outline-none text-sm font-mono leading-relaxed"
              style={{ minHeight }}
              spellCheck={false}
            />
          </div>
        )}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="relative overflow-auto bg-muted/20">
            {viewMode === "split" && isRendering && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Rendering preview...
                </div>
              </div>
            )}
            <div
              className="markdown-preview px-4 py-3"
              style={{ minHeight }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </div>
      <div className="border-t px-4 py-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono text-[10px]">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono text-[10px]">B</kbd>
              <span>Bold</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono text-[10px]">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono text-[10px]">I</kbd>
              <span>Italic</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono text-[10px]">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono text-[10px]">K</kbd>
              <span>Link</span>
            </span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {value.length} {value.length === 1 ? 'character' : 'characters'}
          </span>
        </div>
      </div>
    </div>
  );
}
