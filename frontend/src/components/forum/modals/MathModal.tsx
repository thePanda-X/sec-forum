import { useState, useEffect, useRef } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sigma, AlertCircle, Copy, Check } from "lucide-react";
import katex from "katex";

interface MathModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (markdown: string) => void;
  selectedText?: string;
}

type MathMode = "inline" | "block";

const EXAMPLE_EQUATIONS = [
  { label: "Quadratic Formula", latex: "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}" },
  { label: "Pythagorean Theorem", latex: "a^2 + b^2 = c^2" },
  { label: "Euler's Identity", latex: "e^{i\\pi} + 1 = 0" },
  { label: "Integral", latex: "\\int_{a}^{b} f(x) \\, dx" },
  { label: "Summation", latex: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" },
  { label: "Matrix", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
  { label: "Limit", latex: "\\lim_{x \\to \\infty} \\frac{1}{x} = 0" },
  { label: "Derivative", latex: "\\frac{d}{dx} e^x = e^x" },
];

export function MathModal({
  open,
  onOpenChange,
  onInsert,
  selectedText = "",
}: MathModalProps) {
  const [latex, setLatex] = useState(selectedText);
  const [mode, setMode] = useState<MathMode>("block");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setLatex(selectedText);
      setMode("block");
      setError("");
      setCopied(false);
    }
  }, [open, selectedText]);

  useEffect(() => {
    if (!previewRef.current) return;

    if (!latex.trim()) {
      previewRef.current.innerHTML = '<span class="text-muted-foreground">Preview will appear here</span>';
      setError("");
      return;
    }

    try {
      const html = katex.renderToString(latex, {
        displayMode: mode === "block",
        throwOnError: true,
        strict: false,
      });
      previewRef.current.innerHTML = html;
      setError("");
    } catch (err: any) {
      setError(err.message || "Invalid LaTeX syntax");
      previewRef.current.innerHTML = `<span class="text-destructive text-sm">${err.message || "Invalid LaTeX"}</span>`;
    }
  }, [latex, mode]);

  const generateMarkdown = (): string => {
    if (!latex.trim()) return "";
    
    if (mode === "inline") {
      return `$${latex}$`;
    } else {
      return `$$\n${latex}\n$$`;
    }
  };

  const handleInsert = () => {
    if (!latex.trim()) {
      setError("Please enter a LaTeX equation");
      return;
    }

    // Check if the equation is valid
    try {
      katex.renderToString(latex, { throwOnError: true });
    } catch {
      // Allow insertion even if preview fails (might work with different renderer)
    }

    const markdown = generateMarkdown();
    onInsert(mode === "block" ? "\n" + markdown + "\n" : markdown);
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
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleInsert();
    }
  };

  const insertExample = (example: string) => {
    setLatex(example);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sigma className="h-5 w-5" />
            Insert Math Equation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Display Mode</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as MathMode)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="block" id="block" />
                <Label htmlFor="block" className="font-normal cursor-pointer">
                  Block (centered, own line)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inline" id="inline" />
                <Label htmlFor="inline" className="font-normal cursor-pointer">
                  Inline (within text)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="latex">LaTeX Equation</Label>
            <Textarea
              id="latex"
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter LaTeX equation (e.g., x^2 + y^2 = r^2)"
              className="font-mono text-sm min-h-[100px] resize-y"
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to insert. Use LaTeX syntax for math formatting.
            </p>
          </div>

          {/* Example equations */}
          <div className="space-y-2">
            <Label>Quick Examples</Label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_EQUATIONS.map((example) => (
                <Button
                  key={example.label}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => insertExample(example.latex)}
                  type="button"
                >
                  {example.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Live Preview</Label>
            <div 
              className={`p-4 rounded-lg bg-muted/30 border min-h-[60px] flex items-center ${
                mode === "block" ? "justify-center" : "justify-start"
              }`}
            >
              <div ref={previewRef} className="overflow-x-auto max-w-full" />
            </div>
          </div>

          {/* Markdown Output */}
          {latex.trim() && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Markdown Output</Label>
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
              <pre className="p-3 rounded-lg bg-muted/50 border text-xs overflow-x-auto font-mono">
                {generateMarkdown()}
              </pre>
            </div>
          )}

          {/* LaTeX Reference */}
          <div className="space-y-2">
            <Label>Common LaTeX Symbols</Label>
            <div className="p-3 rounded-lg bg-muted/30 border text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                <span><code>\frac{"{a}{b}"}</code> - Fraction</span>
                <span><code>\sqrt{"{x}"}</code> - Square root</span>
                <span><code>x^2</code> - Superscript</span>
                <span><code>x_i</code> - Subscript</span>
                <span><code>\sum</code> - Sum</span>
                <span><code>\int</code> - Integral</span>
                <span><code>\alpha, \beta</code> - Greek</span>
                <span><code>\infty</code> - Infinity</span>
                <span><code>\pm</code> - Plus/minus</span>
                <span><code>\times, \div</code> - Operators</span>
                <span><code>\leq, \geq</code> - Comparisons</span>
                <span><code>\neq</code> - Not equal</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!latex.trim()}>
            Insert Equation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
