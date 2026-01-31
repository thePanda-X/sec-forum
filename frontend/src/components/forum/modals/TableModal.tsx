import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Table, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (markdown: string) => void;
}

export function TableModal({
  open,
  onOpenChange,
  onInsert,
}: TableModalProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hasHeader, setHasHeader] = useState(true);
  const [alignment, setAlignment] = useState<("left" | "center" | "right")[]>(["left", "left", "left"]);
  const [cellContents, setCellContents] = useState<string[][]>([["", "", ""], ["", "", ""], ["", "", ""]]);

  const maxRows = 20;
  const maxCols = 10;

  useEffect(() => {
    if (open) {
      setRows(3);
      setCols(3);
      setHasHeader(true);
      setAlignment(["left", "left", "left"]);
      setCellContents([["", "", ""], ["", "", ""], ["", "", ""]]);
    }
  }, [open]);

  useEffect(() => {
    // Update alignment array when cols change
    setAlignment((prev) => {
      if (prev.length < cols) {
        return [...prev, ...Array(cols - prev.length).fill("left")];
      }
      return prev.slice(0, cols);
    });

    // Update cell contents when dimensions change
    setCellContents((prev) => {
      const newContents: string[][] = [];
      for (let r = 0; r < rows; r++) {
        newContents[r] = [];
        for (let c = 0; c < cols; c++) {
          newContents[r][c] = prev[r]?.[c] ?? "";
        }
      }
      return newContents;
    });
  }, [rows, cols]);

  const generateMarkdown = (): string => {
    const lines: string[] = [];
    
    // Generate header row
    if (hasHeader) {
      const headerCells = cellContents[0]?.map((cell, i) => 
        cell || `Header ${i + 1}`
      ) || Array(cols).fill(null).map((_, i) => `Header ${i + 1}`);
      lines.push(`| ${headerCells.join(" | ")} |`);
      
      // Generate alignment row
      const alignRow = alignment.map((align) => {
        switch (align) {
          case "center": return ":---:";
          case "right": return "---:";
          default: return "---";
        }
      });
      lines.push(`| ${alignRow.join(" | ")} |`);
      
      // Generate data rows (skip first row since it's header)
      for (let r = 1; r < rows; r++) {
        const rowCells = cellContents[r]?.map((cell) => cell || "     ") 
          || Array(cols).fill("     ");
        lines.push(`| ${rowCells.join(" | ")} |`);
      }
    } else {
      // No header - just alignment row and data
      const alignRow = alignment.map((align) => {
        switch (align) {
          case "center": return ":---:";
          case "right": return "---:";
          default: return "---";
        }
      });
      
      // First row is data
      const firstRowCells = cellContents[0]?.map((cell) => cell || "     ") 
        || Array(cols).fill("     ");
      lines.push(`| ${firstRowCells.join(" | ")} |`);
      lines.push(`| ${alignRow.join(" | ")} |`);
      
      for (let r = 1; r < rows; r++) {
        const rowCells = cellContents[r]?.map((cell) => cell || "     ") 
          || Array(cols).fill("     ");
        lines.push(`| ${rowCells.join(" | ")} |`);
      }
    }

    return lines.join("\n");
  };

  const handleInsert = () => {
    const markdown = generateMarkdown();
    onInsert("\n" + markdown + "\n");
    onOpenChange(false);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    setCellContents((prev) => {
      const newContents = [...prev];
      if (!newContents[row]) newContents[row] = [];
      newContents[row][col] = value;
      return newContents;
    });
  };

  const cycleAlignment = (colIndex: number) => {
    setAlignment((prev) => {
      const newAlign = [...prev];
      const current = newAlign[colIndex];
      if (current === "left") newAlign[colIndex] = "center";
      else if (current === "center") newAlign[colIndex] = "right";
      else newAlign[colIndex] = "left";
      return newAlign;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-fit min-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Insert Table
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dimensions */}
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <Label>Rows</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRows(Math.max(1, rows - 1))}
                  disabled={rows <= 1}
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={rows}
                  onChange={(e) => setRows(Math.min(maxRows, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center"
                  min={1}
                  max={maxRows}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRows(Math.min(maxRows, rows + 1))}
                  disabled={rows >= maxRows}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Columns</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCols(Math.max(1, cols - 1))}
                  disabled={cols <= 1}
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={cols}
                  onChange={(e) => setCols(Math.min(maxCols, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center"
                  min={1}
                  max={maxCols}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCols(Math.min(maxCols, cols + 1))}
                  disabled={cols >= maxCols}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-end pb-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-header"
                  checked={hasHeader}
                  onCheckedChange={(checked) => setHasHeader(checked === true)}
                />
                <Label htmlFor="has-header" className="text-sm font-normal cursor-pointer">
                  Include header row
                </Label>
              </div>
            </div>
          </div>

          {/* Table Editor */}
          <div className="space-y-2">
            <Label>Table Content (click headers to change alignment)</Label>
            {alignment.length >= cols && cellContents.length >= rows && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {Array(cols).fill(null).map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className={cn(
                          "border-b border-r p-1 bg-muted/50 cursor-pointer hover:bg-muted transition-colors",
                          alignment[colIndex] === "center" && "text-center",
                          alignment[colIndex] === "right" && "text-right"
                        )}
                        onClick={() => cycleAlignment(colIndex)}
                        title={`Click to change alignment (current: ${alignment[colIndex] || "left"})`}
                      >
                        <div className="flex items-center justify-center gap-1 px-2 py-1">
                          <span className="text-xs text-muted-foreground uppercase">
                            {(alignment[colIndex] || "left")[0]}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array(rows).fill(null).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array(cols).fill(null).map((_, colIndex) => (
                        <td
                          key={colIndex}
                          className={cn(
                            "border-b border-r p-0",
                            rowIndex === 0 && hasHeader && "bg-muted/30"
                          )}
                        >
                          <Input
                            value={cellContents[rowIndex]?.[colIndex] || ""}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                            placeholder={rowIndex === 0 && hasHeader ? `Header ${colIndex + 1}` : ""}
                            className={cn(
                              "border-0 rounded-none h-9 text-sm focus-visible:ring-1 focus-visible:ring-inset min-w-[100px]",
                              alignment[colIndex] === "center" && "text-center",
                              alignment[colIndex] === "right" && "text-right"
                            )}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            <p className="text-xs text-muted-foreground">
              Click column headers to cycle alignment: Left → Center → Right
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Markdown Preview</Label>
            <pre className="p-3 rounded-lg bg-muted/50 border text-xs overflow-x-auto font-mono">
              {generateMarkdown()}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>
            Insert Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
