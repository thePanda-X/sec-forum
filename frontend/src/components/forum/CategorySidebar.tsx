import {
  AlertTriangle,
  Terminal,
  Bug,
  Network,
  Lock,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

const categories: Category[] = [
  {
    id: "threat-intelligence",
    name: "Threat Intelligence",
    icon: <AlertTriangle className="h-4 w-4" />,
    count: 342,
  },
  {
    id: "penetration-testing",
    name: "Penetration Testing",
    icon: <Terminal className="h-4 w-4" />,
    count: 518,
  },
  {
    id: "malware-analysis",
    name: "Malware Analysis",
    icon: <Bug className="h-4 w-4" />,
    count: 276,
  },
  {
    id: "network-security",
    name: "Network Security",
    icon: <Network className="h-4 w-4" />,
    count: 421,
  },
  {
    id: "cryptography",
    name: "Cryptography",
    icon: <Lock className="h-4 w-4" />,
    count: 189,
  },
  {
    id: "career-certifications",
    name: "Career & Certifications",
    icon: <Award className="h-4 w-4" />,
    count: 634,
  },
];

interface CategorySidebarProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string | undefined) => void;
}

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <aside className="w-64 shrink-0">
      <nav className="space-y-1">
        {/* All Categories */}
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

        {/* Category List */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory?.(category.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
              selectedCategory === category.id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                selectedCategory === category.id ? "text-primary" : "text-muted-foreground"
              )}>
                {category.icon}
              </span>
              <span>{category.name}</span>
            </div>
            <span className="text-xs">{category.count}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
