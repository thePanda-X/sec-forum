import {
  TrendingUp,
  MessageSquare,
  Users,
  Eye,
  Trophy,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ForumStats {
  totalPosts: number;
  members: number;
  totalReplies: number;
  onlineNow: number;
}

interface TopContributor {
  id: string;
  name: string;
  avatar?: string;
  reputation: number;
  posts: number;
  rank: number;
  isAdmin?: boolean;
}

interface TrendingTag {
  id: string;
  name: string;
}

const stats: ForumStats = {
  totalPosts: 8,
  members: 2847,
  totalReplies: 393,
  onlineNow: 144,
};

const topContributors: TopContributor[] = [
  {
    id: "1",
    name: "admin",
    reputation: 1580,
    posts: 4,
    rank: 1,
    isAdmin: true,
  },
  {
    id: "2",
    name: "user",
    reputation: 245,
    posts: 4,
    rank: 2,
  },
];

const trendingTags: TrendingTag[] = [
  { id: "1", name: "#CVE" },
  { id: "2", name: "#RCE" },
  { id: "3", name: "#Enterprise" },
  { id: "4", name: "#API" },
  { id: "5", name: "#Testing" },
  { id: "6", name: "#Best Practices" },
  { id: "7", name: "#Emotet" },
  { id: "8", name: "#Botnet" },
];

export function ForumStatsSidebar() {
  return (
    <aside className="w-72 shrink-0 space-y-6">
      {/* Forum Statistics */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 font-semibold mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          Forum Statistics
        </h3>
        <div className="space-y-3">
          <StatItem
            icon={<MessageSquare className="h-4 w-4" />}
            label="Total Posts"
            value={stats.totalPosts}
          />
          <StatItem
            icon={<Users className="h-4 w-4" />}
            label="Members"
            value={stats.members.toLocaleString()}
          />
          <StatItem
            icon={<MessageSquare className="h-4 w-4" />}
            label="Total Replies"
            value={stats.totalReplies}
          />
          <StatItem
            icon={<Eye className="h-4 w-4" />}
            label="Online Now"
            value={stats.onlineNow}
            highlight
          />
        </div>
      </div>

      {/* Top Contributors */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 font-semibold mb-4">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top Contributors
        </h3>
        <div className="space-y-3">
          {topContributors.map((contributor) => (
            <div key={contributor.id} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-4">
                {contributor.rank}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={contributor.avatar} />
                <AvatarFallback className="bg-teal-600 text-white text-xs">
                  {contributor.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">
                    {contributor.name}
                  </span>
                  {contributor.isAdmin && (
                    <svg className="h-3 w-3 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {contributor.reputation} rep • {contributor.posts} posts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Tags */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold mb-4">Trending Tags</h3>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs font-normal hover:bg-secondary/80 cursor-pointer"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
    </aside>
  );
}

function StatItem({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-medium ${highlight ? "text-primary" : ""}`}>
        {value}
      </span>
    </div>
  );
}
