import "reflect-metadata";
import { Controller, Get } from "elysia-decorators";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { logger } from "../../utils/logger";
import type { Context } from "elysia";

const MAX_LINE_LENGTH = 120;
const LARGE_FILE_LINE_COUNT = 400;
const SKIP_DIRECTORIES = new Set(["node_modules", "dist", "build", ".git", ".bun"]);

interface QualityMetrics {
  totalFiles: number;
  totalLines: number;
  averageFileLength: number;
  longLineCount: number;
  anyTypeCount: number;
  todoCount: number;
  consoleCount: number;
  largeFileCount: number;
  hasTests: boolean;
}

interface QualityReport {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  analyzedAt: string;
  scope: string;
  metrics: QualityMetrics;
  feedback: string[];
}

@Controller("/quality")
export class QualityController {
  @Get(
    "/report",
    {
      detail: {
        tags: ["Code Quality"],
        summary: "Backend code quality report",
        description: "Analyze backend source code and return a quality score with feedback",
        responses: {
          200: { description: "Code quality report" },
          500: { description: "Failed to analyze backend code" },
        },
      },
      config: { allowMeta: true },
    } as any
  )
  async report({ set }: Context): Promise<QualityReport | { error: string }> {
    try {
      return await this.buildReport();
    } catch (error) {
      logger.error("Failed to analyze backend code", {
        error: error instanceof Error ? error.message : String(error),
      });
      set.status = 500;
      return { error: "Failed to analyze backend code" };
    }
  }

  private async buildReport(): Promise<QualityReport> {
    const backendRoot = process.cwd();
    const sourceRoot = join(backendRoot, "src");
    const sourceFiles = await this.collectSourceFiles(sourceRoot);
    const allFiles = await this.collectSourceFiles(backendRoot);

    if (sourceFiles.length === 0) {
      return {
        score: 0,
        grade: "F",
        summary: "No backend source files were detected for analysis.",
        analyzedAt: new Date().toISOString(),
        scope: sourceRoot,
        metrics: {
          totalFiles: 0,
          totalLines: 0,
          averageFileLength: 0,
          longLineCount: 0,
          anyTypeCount: 0,
          todoCount: 0,
          consoleCount: 0,
          largeFileCount: 0,
          hasTests: false,
        },
        feedback: ["Add backend source files so automated analysis can run."],
      };
    }

    const metrics = await this.calculateMetrics(sourceFiles, allFiles);
    const feedback = this.buildFeedback(metrics);
    const score = this.calculateScore(metrics);

    return {
      score,
      grade: this.scoreToGrade(score),
      summary: `Analyzed ${metrics.totalFiles} backend files with ${metrics.totalLines} total lines of code.`,
      analyzedAt: new Date().toISOString(),
      scope: sourceRoot,
      metrics,
      feedback,
    };
  }

  private async collectSourceFiles(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) {
          continue;
        }
        files.push(...(await this.collectSourceFiles(join(directory, entry.name))));
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(join(directory, entry.name));
      }
    }

    return files;
  }

  private async calculateMetrics(sourceFiles: string[], allFiles: string[]): Promise<QualityMetrics> {
    let totalLines = 0;
    let longLineCount = 0;
    let anyTypeCount = 0;
    let todoCount = 0;
    let consoleCount = 0;
    let largeFileCount = 0;

    const anyTypeRegex = /\bany\b/g;
    const todoRegex = /\bTODO\b|\bFIXME\b/g;
    const consoleRegex = /\bconsole\.(log|debug|info|warn|error)\b/g;

    for (const file of sourceFiles) {
      const contents = await readFile(file, "utf8");
      const sanitizedContents = this.stripCommentsAndStrings(contents);
      const lines = contents.split(/\r?\n/);
      totalLines += lines.length;

      if (lines.length > LARGE_FILE_LINE_COUNT) {
        largeFileCount += 1;
      }

      for (const line of lines) {
        if (line.length > MAX_LINE_LENGTH) {
          longLineCount += 1;
        }
      }

      anyTypeCount += (sanitizedContents.match(anyTypeRegex) || []).length;
      todoCount += (contents.match(todoRegex) || []).length;
      consoleCount += (sanitizedContents.match(consoleRegex) || []).length;
    }

    const testFileRegex = /(\.test\.|\.spec\.|__tests__)/i;
    const hasTests = allFiles.some((file) => testFileRegex.test(file));

    return {
      totalFiles: sourceFiles.length,
      totalLines,
      averageFileLength: Math.round(totalLines / sourceFiles.length),
      longLineCount,
      anyTypeCount,
      todoCount,
      consoleCount,
      largeFileCount,
      hasTests,
    };
  }

  private calculateScore(metrics: QualityMetrics): number {
    let score = 100;
    score -= Math.min(20, metrics.anyTypeCount * 2);
    score -= Math.min(15, metrics.todoCount * 2);
    score -= Math.min(10, Math.floor(metrics.longLineCount / 10));
    score -= Math.min(10, metrics.consoleCount);
    score -= Math.min(10, metrics.largeFileCount * 2);

    if (metrics.averageFileLength > 300) {
      score -= 5;
    }

    if (!metrics.hasTests) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private stripCommentsAndStrings(content: string): string {
    const withoutStrings = content
      .replace(/`(?:\\.|[^`\\])*`/g, "")
      .replace(/"(?:\\.|[^"\\])*"/g, "")
      .replace(/'(?:\\.|[^'\\])*'/g, "");

    return withoutStrings
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
  }

  private buildFeedback(metrics: QualityMetrics): string[] {
    const feedback: string[] = [];

    if (metrics.anyTypeCount > 0) {
      feedback.push("Replace 'any' usage with explicit types to improve type safety.");
    }

    if (metrics.todoCount > 0) {
      feedback.push("Resolve TODO/FIXME comments or track them in a technical-debt backlog.");
    }

    if (metrics.longLineCount > 0) {
      feedback.push(
        `Wrap long lines (${MAX_LINE_LENGTH}+ chars) to keep code readable and review-friendly.`
      );
    }

    if (metrics.consoleCount > 0) {
      feedback.push("Use the structured logger instead of console statements for consistent logging.");
    }

    if (metrics.largeFileCount > 0 || metrics.averageFileLength > 300) {
      feedback.push("Split large modules into smaller units to improve maintainability.");
    }

    if (!metrics.hasTests) {
      feedback.push("Add automated tests to improve confidence and prevent regressions.");
    }

    if (feedback.length === 0) {
      feedback.push("Codebase looks solid; keep enforcing the current conventions and reviews.");
    }

    return feedback;
  }

  private scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }
}
