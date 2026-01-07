import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, User, Tag, MessageSquare, Eye, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseMarkdown } from "@/lib/markdown";
import { Header } from "./Header";
import { CategorySidebar } from "./CategorySidebar";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "/api/v1";

interface PostAuthor {
    id: string;
    email: string;
    displayName?: string;
    username?: string;
}

interface PostTag {
    id: string;
    name: string;
}

interface Post {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    updatedAt: string;
    author: PostAuthor;
    tags: PostTag[];
}

export function PostView() {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [content, setContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE}/posts/${postId}`, {
                    credentials: "include",
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Post not found");
                    }
                    throw new Error("Failed to fetch post");
                }

                const data = await response.json();

                const mappedPost: Post = {
                    id: data.id,
                    title: data.title,
                    body: data.body,
                    createdAt: formatDate(data.createdAt),
                    updatedAt: data.updatedAt,
                    author: {
                        id: data.author.id,
                        email: data.author.email,
                        displayName: data.author.displayName || "Unknown",
                        username: data.author.username,
                    },
                    tags: (data.tags || []).map((tag: any) => ({
                        id: tag.id || tag,
                        name: tag.name || tag,
                    })),
                };

                setPost(mappedPost);

                const renderedContent = await parseMarkdown(data.body || "");
                setContent(renderedContent);

                fetch(`${API_BASE}/posts/${postId}/views`, {
                    method: "POST",
                    credentials: "include",
                }).catch(console.error);
            } catch (err) {
                console.error("Failed to fetch post:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch post");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    const headerUser = user
        ? {
            name: user.name,
            role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
            avatar: user.avatar,
            isAdmin: user.role === "admin",
            isModerator: user.role === "moderator",
            username: user.username,
        }
        : undefined;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header user={headerUser} />
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-background">
                <Header user={headerUser} />
                <div className="container mx-auto px-4 py-6">
                    <div className="text-center py-12">
                        <p className="text-destructive">{error || "Post not found"}</p>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/")}
                            className="mt-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Forum
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header user={headerUser} />

            <div className="container mx-auto px-4 py-6">
                <div className="flex gap-6">
                    <CategorySidebar className="hidden lg:block shrink-0" />

                    <main className="flex-1 min-w-0">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/")}
                            className="mb-4 gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Forum
                        </Button>

                        <article className="bg-card border border-border rounded-lg">
                            <div className="p-4 md:p-6 border-b border-border">
                                <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                                    {post.title}
                                </h1>

                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <div
                                            onClick={() => {
                                                console.log("PostView author click - username:", post.author.username);
                                                if (post.author.username) {
                                                    console.log("Navigating to:", `/profile/${post.author.username}`);
                                                    window.location.href = `/profile/${post.author.username}`;
                                                }
                                            }}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={post.author.avatar} />
                                                <AvatarFallback className="bg-teal-600 text-white text-sm">
                                                    {post.author.displayName?.charAt(0).toUpperCase() || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex flex-col">
                                            <button
                                                onClick={() => {
                                                    if (post.author.username) {
                                                        window.location.href = `/profile/${post.author.username}`;
                                                    }
                                                }}
                                                className="text-sm font-medium hover:text-primary transition-colors text-left"
                                            >
                                                {post.author.displayName || "Unknown"}
                                            </button>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {post.createdAt}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {post.tags.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                <Tag className="h-3 w-3 mr-1" />
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div
                                className="p-4 md:p-6 prose prose-sm md:prose-base max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        </article>

                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>Comments section coming soon</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
