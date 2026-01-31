import { useTranslation } from "react-i18next";
import { Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "recent" | "popular" | "trending" | "unanswered" | "oldest" | "most-replies";

interface FilterDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptionKeys: { value: SortOption; key: string }[] = [
  { value: "recent", key: "filters.recent" },
  { value: "popular", key: "filters.popular" },
  { value: "trending", key: "filters.trending" },
  { value: "most-replies", key: "filters.mostReplies" },
  { value: "oldest", key: "filters.oldest" },
  { value: "unanswered", key: "filters.unanswered" },
];

export function FilterDropdown({ value, onChange }: FilterDropdownProps) {
  const { t } = useTranslation('forum');
  const currentKey = sortOptionKeys.find((opt) => opt.value === value)?.key ?? "filters.recent";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Filter className="h-4 w-4" />
          {t(currentKey)}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {sortOptionKeys.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={value === option.value ? "bg-secondary" : ""}
          >
            {t(option.key)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { SortOption };
