import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { parseMarkdown } from "@/lib/markdown";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    const renderMarkdown = async () => {
      const parsed = await parseMarkdown(content || "");
      setHtml(parsed);
    };
    renderMarkdown();
  }, [content]);

  return (
    <div
      className={cn("markdown-preview", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
