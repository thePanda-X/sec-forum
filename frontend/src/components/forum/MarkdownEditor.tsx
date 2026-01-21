import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  Link,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Image,
  Eye,
  Edit3,
  Code2,
  Table,
  CheckSquare,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  Search,
  Save,
  Smile,
  Command,
  MoreHorizontal,
  SeparatorHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseMarkdown } from "@/lib/markdown";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onImageUpload?: (file: File) => Promise<string>;
  storageKey?: string;
}

interface HistoryState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

type ViewMode = "write" | "preview";

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your post in markdown...",
  className,
  minHeight = "400px",
  onImageUpload,
  storageKey = "markdown-editor-content",
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("write");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([{ value, selectionStart: 0, selectionEnd: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [savedStatus, setSavedStatus] = useState<"saved" | "unsaved">("saved");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  
  const editorRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (storageKey) {
      const savedContent = localStorage.getItem(storageKey);
      if (savedContent && savedContent !== value) {
        onChange(savedContent);
      }
    }
  }, []);

  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (storageKey) {
        localStorage.setItem(storageKey, value);
        setSavedStatus("saved");
      }
    }, 2000);

    setSavedStatus("unsaved");

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [value, storageKey]);

  useEffect(() => {
    let isMounted = true;
    
    const updatePreview = async () => {
      const html = await parseMarkdown(value || "");
      if (isMounted) {
        setPreviewHtml(html);
      }
    };
    
    updatePreview();
    
    return () => {
      isMounted = false;
    };
  }, [value]);

  const addToHistory = useCallback((newValue: string, selectionStart: number, selectionEnd: number) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return [...newHistory, { value: newValue, selectionStart, selectionEnd }];
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newState = history[historyIndex - 1];
      onChange(newState.value);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, onChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newState = history[historyIndex + 1];
      onChange(newState.value);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, onChange]);

  const insertMarkdown = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const textarea = editorRef.current?.textarea;
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
      addToHistory(newText, start + before.length, start + before.length + selectedText.length);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      }, 0);
    },
    [value, onChange, addToHistory]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case "y":
            e.preventDefault();
            handleRedo();
            break;
          case "f":
            e.preventDefault();
            setShowSearch(!showSearch);
            break;
          case "s":
            e.preventDefault();
            if (storageKey) {
              localStorage.setItem(storageKey, value);
              setSavedStatus("saved");
              toast.success("Content saved");
            }
            break;
        }
      }

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const textarea = editorRef.current?.textarea;
        if (textarea && textarea.value.slice(textarea.selectionStart - 1, textarea.selectionStart) === "\n") {
          e.preventDefault();
          setShowCommandPalette(true);
        }
      }

      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        insertMarkdown("  ", "", "");
      }

      if (e.key === "Enter") {
        const textarea = editorRef.current?.textarea;
        if (textarea) {
          const lineStart = textarea.value.lastIndexOf("\n", textarea.selectionStart - 1) + 1;
          const line = textarea.value.substring(lineStart, textarea.selectionStart);
          const match = line.match(/^(\s*)([-*+]|\d+\.)\s/);
          if (match) {
            e.preventDefault();
            insertMarkdown("\n" + match[1] + match[2] + " ", "", "");
          }
        }
      }
    },
    [insertMarkdown, handleUndo, handleRedo, showSearch, storageKey, value]
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
            insertMarkdown(`\n![${file.name}](${imageUrl})\n`);
            toast.success("Image uploaded");
          } catch (error) {
            console.error("Failed to upload image:", error);
            toast.error("Image upload failed", { description: "Failed to upload the pasted image" });
          }
        }
      }
    },
    [onImageUpload, insertMarkdown]
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
          insertMarkdown(`\n![${file.name}](${imageUrl})\n`);
          toast.success("Image uploaded");
        } catch (error) {
          console.error("Failed to upload image:", error);
          toast.error("Image upload failed", { description: "Failed to upload the dropped image" });
        }
      }
    },
    [onImageUpload, insertMarkdown]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleEmojiSelect = useCallback((emoji: any) => {
    insertMarkdown(emoji.emoji, "", "");
    setShowEmojiPicker(false);
  }, [insertMarkdown]);

  const handleCommandSelect = useCallback((command: string) => {
    switch (command) {
      case "heading1":
        insertMarkdown("# ", "", "");
        break;
      case "heading2":
        insertMarkdown("## ", "", "");
        break;
      case "heading3":
        insertMarkdown("### ", "", "");
        break;
      case "code":
        insertMarkdown("```\n", "\n```", "code");
        break;
      case "quote":
        insertMarkdown("> ", "", "");
        break;
      case "table":
        insertMarkdown("| Header | Header |\n|--------|--------|\n| Cell   | Cell   |");
        break;
      case "list":
        insertMarkdown("- ", "", "");
        break;
      case "numbered-list":
        insertMarkdown("1. ", "", "");
        break;
      case "checklist":
        insertMarkdown("- [ ] ", "", "");
        break;
      case "link":
        insertMarkdown("[", "](url)", "link text");
        break;
      case "image":
        insertMarkdown("![", "](url)", "image alt text");
        break;
      case "horizontal-rule":
        insertMarkdown("\n---\n");
        break;
    }
    setShowCommandPalette(false);
  }, [insertMarkdown]);

  const handleSearch = useCallback(() => {
    const textarea = editorRef.current?.textarea;
    if (!textarea || !searchQuery) return;

    const text = textarea.value;
    const index = text.indexOf(searchQuery, textarea.selectionEnd);
    
    if (index !== -1) {
      textarea.focus();
      textarea.setSelectionRange(index, index + searchQuery.length);
    } else {
      const firstIndex = text.indexOf(searchQuery);
      if (firstIndex !== -1) {
        textarea.focus();
        textarea.setSelectionRange(firstIndex, firstIndex + searchQuery.length);
      } else {
        toast.info("Text not found");
      }
    }
  }, [searchQuery]);

  const handleReplace = useCallback(() => {
    const textarea = editorRef.current?.textarea;
    if (!textarea || !replaceQuery) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (selectedText === searchQuery) {
      const newText = textarea.value.substring(0, start) + replaceQuery + textarea.value.substring(end);
      onChange(newText);
      toast.success("Text replaced");
    } else {
      handleSearch();
    }
  }, [replaceQuery, searchQuery, handleSearch, onChange]);

  const handleReplaceAll = useCallback(() => {
    const textarea = editorRef.current?.textarea;
    if (!textarea || !searchQuery || !replaceQuery) return;

    const newText = textarea.value.split(searchQuery).join(replaceQuery);
    onChange(newText);
    toast.success(`Replaced ${textarea.value.split(searchQuery).length - 1} occurrences`);
  }, [searchQuery, replaceQuery, onChange]);

  const formatGroups = {
    text: [
      { icon: Bold, label: "Bold (Ctrl+B)", action: () => insertMarkdown("**", "**", "bold text") },
      { icon: Italic, label: "Italic (Ctrl+I)", action: () => insertMarkdown("_", "_", "italic text") },
      { icon: Strikethrough, label: "Strikethrough", action: () => insertMarkdown("~~", "~~", "strikethrough") },
      { icon: Code2, label: "Inline Code (Ctrl+E)", action: () => insertMarkdown("`", "`", "code") },
    ],
    structure: [
      { icon: Heading1, label: "Heading 1", action: () => handleCommandSelect("heading1") },
      { icon: Heading2, label: "Heading 2", action: () => handleCommandSelect("heading2") },
      { icon: Heading3, label: "Heading 3", action: () => handleCommandSelect("heading3") },
      { icon: Quote, label: "Quote", action: () => handleCommandSelect("quote") },
    ],
    lists: [
      { icon: SeparatorHorizontal, label: "Bulleted List", action: () => handleCommandSelect("list") },
      { icon: SeparatorHorizontal, label: "Numbered List", action: () => handleCommandSelect("numbered-list") },
      { icon: CheckSquare, label: "Task List", action: () => handleCommandSelect("checklist") },
    ],
    insert: [
      { icon: Link, label: "Link (Ctrl+K)", action: () => insertMarkdown("[", "](url)", "link text") },
      { icon: Image, label: "Image", action: () => insertMarkdown("![", "](url)", "image alt text") },
      { icon: Code2, label: "Code Block", action: () => handleCommandSelect("code") },
      { icon: Table, label: "Table", action: () => handleCommandSelect("table") },
    ],
  };

  const commands = [
    { id: "heading1", label: "Heading 1", description: "# Heading 1", shortcut: "#" },
    { id: "heading2", label: "Heading 2", description: "## Heading 2", shortcut: "##" },
    { id: "heading3", label: "Heading 3", description: "### Heading 3", shortcut: "###" },
    { id: "code", label: "Code Block", description: "``` code ```", shortcut: "```" },
    { id: "quote", label: "Blockquote", description: "> Quote", shortcut: ">" },
    { id: "table", label: "Table", description: "Insert table", shortcut: "" },
    { id: "list", label: "Bullet List", description: "- Item", shortcut: "-" },
    { id: "numbered-list", label: "Numbered List", description: "1. Item", shortcut: "1." },
    { id: "checklist", label: "Task List", description: "- [ ] Task", shortcut: "- [ ]" },
    { id: "link", label: "Link", description: "[text](url)", shortcut: "[" },
    { id: "image", label: "Image", description: "![alt](url)", shortcut: "![" },
    { id: "horizontal-rule", label: "Horizontal Rule", description: "---", shortcut: "---" },
  ];

  const visibleButtons = showMoreTools 
    ? [...formatGroups.text, ...formatGroups.structure, ...formatGroups.lists, ...formatGroups.insert]
    : formatGroups.text;

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden bg-card shadow-sm transition-all duration-200",
      isFullScreen && "fixed inset-4 z-50 rounded-2xl",
      className
    )}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 px-3 py-2 border-b bg-muted/30">
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
          
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-md hover:bg-accent"
                title="Insert Emoji"
                type="button"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <EmojiPicker
                theme={EmojiTheme.LIGHT}
                onEmojiClick={handleEmojiSelect}
                height={350}
                width={320}
              />
            </PopoverContent>
          </Popover>

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

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-md hover:bg-accent"
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
            type="button"
            disabled={historyIndex === 0}
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-md hover:bg-accent"
            onClick={handleRedo}
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
            type="button"
            disabled={historyIndex === history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 rounded-md hover:bg-accent"
                title="Quick Insert (Type ?)"
                type="button"
              >
                <Command className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">?</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Quick Insert</DialogTitle>
              </DialogHeader>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {commands.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => handleCommandSelect(cmd.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent text-left transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{cmd.label}</div>
                      <div className="text-xs text-muted-foreground">{cmd.description}</div>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSearch} onOpenChange={setShowSearch}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-md hover:bg-accent"
                title="Find and Replace (Ctrl+F)"
                type="button"
              >
                <Search className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Find and Replace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Find</Label>
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search text..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replace">Replace with</Label>
                  <Input
                    id="replace"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    placeholder="Replace with..."
                    onKeyDown={(e) => e.key === "Enter" && handleReplace()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSearch} size="sm">Find Next</Button>
                  <Button onClick={handleReplace} size="sm" variant="outline">Replace</Button>
                  <Button onClick={handleReplaceAll} size="sm" variant="outline">Replace All</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-md hover:bg-accent"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            type="button"
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/30">
        <button
          type="button"
          onClick={() => setViewMode("write")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            viewMode === "write" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setViewMode("preview")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            viewMode === "preview" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          Preview
        </button>
      </div>

      <div 
        className="grid grid-cols-1"
        style={{ minHeight }}
      >
        {viewMode === "write" && (
          <div className="relative">
            <MDEditor
              ref={editorRef}
              value={value}
              onChange={(val) => {
                const newValue = val || "";
                onChange(newValue);
                addToHistory(newValue, 0, 0);
              }}
              preview="edit"
              height={isFullScreen ? "calc(100vh - 120px)" : minHeight}
              textareaProps={{
                placeholder,
                onKeyDown: handleKeyDown,
                onPaste: handlePaste,
                onDrop: handleDrop,
                onDragOver: handleDragOver,
              }}
              extraCommands={[
                {
                  name: "save",
                  keyCommand: "save",
                  buttonProps: { "aria-label": "Save", title: "Save" },
                  icon: <Save className="w-4 h-4" />,
                  execute: () => {
                    if (storageKey) {
                      localStorage.setItem(storageKey, value);
                      setSavedStatus("saved");
                      toast.success("Content saved");
                    }
                  },
                },
              ]}
            />
          </div>
        )}
        
        {viewMode === "preview" && (
          <div className="relative overflow-auto bg-muted/20 w-full">
            <div
              className="markdown-preview px-4 py-3 prose dark:prose-invert max-w-none w-full"
              style={{ minHeight: isFullScreen ? "calc(100vh - 120px)" : minHeight }}
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
              <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono text-[10px]">/</kbd>
              <span>Commands</span>
            </span>
            {savedStatus === "unsaved" && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Save className="h-3 w-3" />
                  <span>Unsaved</span>
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{wordCount} words</span>
            <span className="hidden sm:inline">{readingTime} min read</span>
            <span>{value.length} {value.length === 1 ? 'character' : 'characters'}</span>
          </div>
        </div>
      </div>

      <style>{`
        .w-md-editor {
          --wmd-border-color: transparent !important;
          --wmd-toolbar-bg: transparent !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
