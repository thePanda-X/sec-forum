import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Code2, Copy, Check } from "lucide-react";

interface CodeBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (markdown: string) => void;
  selectedText?: string;
}

const LANGUAGES = [
  { value: "plaintext", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "less", label: "Less" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "sql", label: "SQL" },
  { value: "graphql", label: "GraphQL" },
  { value: "bash", label: "Bash/Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "nginx", label: "Nginx" },
  { value: "apache", label: "Apache" },
  { value: "vim", label: "Vim" },
  { value: "lua", label: "Lua" },
  { value: "perl", label: "Perl" },
  { value: "r", label: "R" },
  { value: "matlab", label: "MATLAB" },
  { value: "julia", label: "Julia" },
  { value: "haskell", label: "Haskell" },
  { value: "elixir", label: "Elixir" },
  { value: "erlang", label: "Erlang" },
  { value: "clojure", label: "Clojure" },
  { value: "fsharp", label: "F#" },
  { value: "ocaml", label: "OCaml" },
  { value: "dart", label: "Dart" },
  { value: "solidity", label: "Solidity" },
  { value: "toml", label: "TOML" },
  { value: "ini", label: "INI" },
  { value: "diff", label: "Diff" },
  { value: "makefile", label: "Makefile" },
];

export function CodeBlockModal({
  open,
  onOpenChange,
  onInsert,
  selectedText = "",
}: CodeBlockModalProps) {
  const [language, setLanguage] = useState("plaintext");
  const [code, setCode] = useState(selectedText);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setLanguage("plaintext");
      setCode(selectedText);
      setCopied(false);
    }
  }, [open, selectedText]);

  const generateMarkdown = (): string => {
    // Use empty string for plaintext to avoid unnecessary language identifier
    const lang = language === "plaintext" ? "" : language;
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  };

  const handleInsert = () => {
    const lang = language === "plaintext" ? "" : language;
    if (!code.trim()) {
      // Still insert empty code block structure
      onInsert(`\n\`\`\`${lang}\n\n\`\`\`\n`);
    } else {
      onInsert(`\n${generateMarkdown()}\n`);
    }
    onOpenChange(false);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Cmd/Ctrl+Enter to insert
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleInsert();
    }
    // Tab inserts spaces instead of changing focus
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + "  " + code.substring(end);
      setCode(newCode);
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Insert Code Block
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="Select a language (optional)" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecting a language enables syntax highlighting
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste or type your code here..."
              className="font-mono text-sm min-h-[200px] resize-y"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Press Tab to insert spaces. Press Ctrl+Enter to insert.
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Markdown Preview</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleCopyMarkdown}
                type="button"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="p-3 rounded-lg bg-muted/50 border text-xs overflow-x-auto font-mono whitespace-pre-wrap break-all">
              {generateMarkdown()}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>
            Insert Code Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
