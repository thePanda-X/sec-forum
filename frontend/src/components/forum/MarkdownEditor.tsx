import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Code,
  List,
  Link,
  Heading1,
  Heading2,
  Quote,
  Eye,
  Edit3,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseMarkdown } from "@/lib/markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

type Tab = "write" | "preview";

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your post in markdown...",
  className,
  minHeight = "200px",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("write");
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    const renderMarkdown = async () => {
      if (activeTab === "preview") {
        const html = await parseMarkdown(value || "");
        setPreviewHtml(html);
      }
    };
    renderMarkdown();
  }, [value, activeTab]);

  const insertMarkdown = useCallback(
    (before: string, after: string = "") => {
      const textarea = document.querySelector(
        "textarea[data-markdown-editor]"
      ) as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
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

  const toolbarButtons = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("_", "_") },
    { icon: Code2, label: "Inline Code", action: () => insertMarkdown("`", "`") },
    { icon: List, label: "List", action: () => insertMarkdown("- ") },
    { icon: Link, label: "Link", action: () => insertMarkdown("[", "](url)") },
    { icon: Heading1, label: "Heading 1", action: () => insertMarkdown("# ") },
    { icon: Heading2, label: "Heading 2", action: () => insertMarkdown("## ") },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("> ") },
  ];

  const mainToolbarButtons = toolbarButtons.slice(0, 4);
  const secondaryToolbarButtons = toolbarButtons.slice(4);

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-card", className)}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b px-2 py-1.5 bg-muted/50 gap-2">
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
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
            onClick={() => setActiveTab("write")}
            className={cn(
              "px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition-colors",
              activeTab === "write"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Edit3 className="h-3 w-3" />
            <span className="hidden sm:inline">Write</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={cn(
              "px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition-colors",
              activeTab === "preview"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Eye className="h-3 w-3" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>
      <div className="relative" style={{ minHeight }}>
        {activeTab === "write" ? (
          <textarea
            data-markdown-editor
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full px-3 py-2 bg-transparent resize-none focus:outline-none text-sm font-mono"
            style={{ minHeight }}
          />
        ) : (
          <div
            className="markdown-preview px-3 py-2 overflow-auto"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>
      <div className="border-t px-3 py-1.5 bg-muted/30 hidden sm:block">
        <p className="text-xs text-muted-foreground">
          Supports Markdown. Use # for headings, **bold**, _italic_, `code`, ```code blocks```, &gt; quotes, - lists, and [links](url).
        </p>
      </div>
    </div>
  );
}
