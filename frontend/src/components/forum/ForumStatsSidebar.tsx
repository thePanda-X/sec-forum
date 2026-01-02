import { useState, useEffect } from "react";
import {
    TrendingUp,
    MessageSquare,
    Users,
    Eye,
    Trophy,
    Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const API_BASE = "/api/v1";

interface ForumStats {
    totalPosts: number;
    members: number;
    totalReplies: number;
    onlineNow: number;
}

interface TopContributor {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    reputation: number;
    posts: number;
    postCount?: number;
    rank: number;
    isAdmin?: boolean;
    role?: string;
}

interface TrendingTag {
    id: string;
    name: string;
    count?: number;
}

interface ForumStatsResponse {
    stats?: ForumStats;
    totalPosts?: number;
    members?: number;
    memberCount?: number;
    totalReplies?: number;
    commentCount?: number;
    onlineNow?: number;
    onlineCount?: number;
    topContributors?: TopContributor[];
    trendingTags?: TrendingTag[];
}

interface ForumStatsSidebarProps {
    className?: string;
}

export function ForumStatsSidebar({ className }: ForumStatsSidebarProps) {
    const [stats, setStats] = useState<ForumStats>({
        totalPosts: 0,
        members: 0,
        totalReplies: 0,
        onlineNow: 0,
    });
    const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
    const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch(`${API_BASE}/stats/forum`, {
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch forum stats");
                }

                const data: ForumStatsResponse = await response.json();

                setStats({
                    totalPosts: data.stats?.totalPosts ?? data.totalPosts ?? 0,
                    members: data.stats?.members ?? data.members ?? data.memberCount ?? 0,
                    totalReplies: data.stats?.totalReplies ?? data.totalReplies ?? data.commentCount ?? 0,
                    onlineNow: data.stats?.onlineNow ?? data.onlineNow ?? data.onlineCount ?? 0,
                });

                const contributors = (data.topContributors || []).map((c, index) => ({
                    ...c,
                    name: c.name || c.username || "Unknown",
                    posts: c.posts ?? c.postCount ?? 0,
                    rank: c.rank ?? index + 1,
                    isAdmin: c.isAdmin ?? c.role === "admin",
                }));
                setTopContributors(contributors);

                const tags = (data.trendingTags || []).map((tag) => ({
                    id: tag.id || tag.name,
                    name: tag.name.startsWith("#") ? tag.name : `#${tag.name}`,
                }));
                setTrendingTags(tags);
            } catch (err) {
                console.error("Failed to fetch forum stats:", err);
                setError(err instanceof Error ? err.message : "Failed to load stats");
            } finally {
                setIsLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <aside className={className || "w-72 shrink-0 space-y-8"}>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </aside>
        );
    }

    if (error) {
        return (
            <aside className={className || "w-72 shrink-0 space-y-8"}>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className={className || "w-72 shrink-0 space-y-8"}>
            {/* Forum Statistics */}
            <div className="rounded-lg border border-border bg-card p-4 mb-3">
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
            {topContributors.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4 mb-3">
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
                                            <svg
                                                className="h-3 w-3 text-amber-500"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
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
            )}

            {/* Trending Tags */}
            {trendingTags.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4 mb-3">
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
            )}
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
            <span
                className={`text-sm font-medium ${highlight ? "text-primary" : ""}`}
            >
                {value}
            </span>
        </div>
    );
}
