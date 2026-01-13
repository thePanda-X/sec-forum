import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Terminal,
  Bug,
  Network,
  Lock,
  Award,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "/api/v1";

interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  postCount?: number;
  count?: number;
}

// Map category slugs/names to icons
const iconMap: Record<string, React.ReactNode> = {
  "threat-intelligence": <AlertTriangle className="h-4 w-4" />,
  "penetration-testing": <Terminal className="h-4 w-4" />,
  "malware-analysis": <Bug className="h-4 w-4" />,
  "network-security": <Network className="h-4 w-4" />,
  cryptography: <Lock className="h-4 w-4" />,
  "career-certifications": <Award className="h-4 w-4" />,
};

function getCategoryIcon(category: Category): React.ReactNode {
  // Try slug first, then name (lowercase, hyphenated)
  const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, "-");
  return iconMap[slug] || <FolderOpen className="h-4 w-4" />;
}

interface CategorySidebarProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string | undefined) => void;
  className?: string;
}

export type { Category };

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  className,
}: CategorySidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(`${API_BASE}/categories`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        const categoryList = Array.isArray(data) ? data : data.categories || [];
        setCategories(categoryList);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError(err instanceof Error ? err.message : "Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <aside className={className || "w-64 shrink-0"}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className={className || "w-64 shrink-0"}>
        <p className="text-sm text-destructive p-3">{error}</p>
      </aside>
    );
  }

  return (
    <aside className={className || "w-64 shrink-0"}>
      <nav className="space-y-1">
        <button
          onClick={() => onSelectCategory?.(undefined)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
            !selectedCategory
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          )}
        >
          <span>All Categories</span>
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory?.(String(category.id))}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
              selectedCategory === String(category.id)
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  selectedCategory === (category.slug || category.id)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {getCategoryIcon(category)}
              </span>
              <span>{category.name}</span>
            </div>
            <span className="text-xs">{category.postCount ?? category.count ?? 0}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}