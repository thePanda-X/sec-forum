import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, User, Tag, MessageSquare, Eye, Loader2, FolderTree, Lock, MessageCircle, ArrowUp, ArrowDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseMarkdown } from "@/lib/markdown";
import { Header } from "./Header";
import { CategorySidebar } from "./CategorySidebar";
import { Comments } from "./Comments";
import { CommentForm } from "./CommentForm";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_BASE = "/api/v1";

interface PostAuthor {
    id: string;
    email: string;
    displayName?: string;
    username?: string;
}

interface PostCategory {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon: string;
}

interface PostTag {
    id: string;
    name: string;
}

interface Post {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    locked: boolean;
    createdAt: string;
    updatedAt: string;
    author: PostAuthor;
    category?: PostCategory;
    tags: PostTag[];
    upvotes: number;
    downvotes: number;
    totalVotes: number;
    userVote: number;
}

export function PostView() {
    const { t } = useTranslation(['forum', 'auth', 'common']);
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [content, setContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loginModalOpen, setLoginModalOpen] = useState(false);

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
                pinned: data.pinned || false,
                locked: data.locked || false,
                createdAt: formatDate(data.createdAt),
                updatedAt: data.updatedAt,
                author: {
                    id: data.author.id,
                    email: data.author.email,
                    displayName: data.author.displayName || "Unknown",
                    username: data.author.username,
                },
                category: data.category ? {
                    id: data.category.id,
                    name: data.category.name,
                    slug: data.category.slug,
                    color: data.category.color,
                    icon: data.category.icon,
                } : undefined,
                tags: (data.tags || []).map((tag: any) => ({
                    id: tag.id || tag,
                    name: tag.name || tag,
                })),
                upvotes: data.upvotes || 0,
                downvotes: data.downvotes || 0,
                totalVotes: data.totalVotes || 0,
                userVote: data.userVote || 0,
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

    useEffect(() => {
        fetchPost();
    }, [postId]);

    const handleUpvote = async () => {
        if (!user) {
            setLoginModalOpen(true);
            return;
        }

        if (!post) return;

        try {
            const response = await fetch(`${API_BASE}/posts/${post.id}/upvote`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                fetchPost();
            } else {
                toast.error(t('toast.voteFailed'), {
                    description: t('toast.voteFailedDesc'),
                });
            }
        } catch (err) {
            console.error("Failed to upvote post:", err);
            toast.error(t('toast.voteFailed'), {
                description: t('toast.voteFailedDesc'),
            });
        }
    };

    const handleDownvote = async () => {
        if (!user) {
            setLoginModalOpen(true);
            return;
        }

        if (!post) return;

        try {
            const response = await fetch(`${API_BASE}/posts/${post.id}/downvote`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                fetchPost();
            } else {
                toast.error(t('toast.voteFailed'), {
                    description: t('toast.voteFailedDesc'),
                });
            }
        } catch (err) {
            console.error("Failed to downvote post:", err);
            toast.error(t('toast.voteFailed'), {
                description: t('toast.voteFailedDesc'),
            });
        }
    };

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
                        <p className="text-destructive">{error || t('posts.view.notFound')}</p>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/")}
                            className="mt-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('posts.view.backToForum')}
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
                    <CategorySidebar className="hidden lg:block shrink-0 lg:w-64" />

                    <main className="flex-1 min-w-0">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/")}
                            className="mb-4 gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('posts.view.backToForum')}
                        </Button>

                        <article className="bg-card border border-border rounded-lg">
                            <div className="p-4 md:p-6 border-b border-border">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                                            {post.title}
                                        </h1>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={handleUpvote}
                                                    className={`p-1.5 rounded transition-colors ${
                                                        post.userVote === 1
                                                            ? 'text-green-500 hover:bg-green-500/10'
                                                            : 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'
                                                    }`}
                                                    title="Upvote"
                                                >
                                                    <ArrowUp className="h-5 w-5" />
                                                </button>
                                                <span className="text-sm font-medium min-w-[2rem] text-center">
                                                    {post.totalVotes}
                                                </span>
                                                <button
                                                    onClick={handleDownvote}
                                                    className={`p-1.5 rounded transition-colors ${
                                                        post.userVote === -1
                                                            ? 'text-red-500 hover:bg-red-500/10'
                                                            : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                                                    }`}
                                                    title="Downvote"
                                                >
                                                    <ArrowDown className="h-5 w-5" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {post.locked && (
                                                    <Badge variant="secondary" className="text-xs gap-1">
                                                        <Lock className="h-3 w-3" />
                                                        {t('posts.view.locked')}
                                                    </Badge>
                                                )}
                                                {post.category && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs gap-1 shrink-0"
                                                        style={{
                                                            borderColor: post.category.color,
                                                            color: post.category.color,
                                                            backgroundColor: `${post.category.color}10`
                                                        }}
                                                    >
                                                        {post.category.icon === "FolderTree" ? (
                                                            <FolderTree className="h-3 w-3" />
                                                        ) : (
                                                            <FolderTree className="h-3 w-3" />
                                                        )}
                                                        {post.category.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

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
                                className="p-4 md:p-6 markdown-preview prose prose-sm md:prose-base max-w-none"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        </article>

                        {!user && (
                            <div className="mt-6 p-6 bg-muted/50 rounded-lg text-center border border-border">
                                <MessageCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">{t('posts.view.joinDiscussion')}</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t('posts.view.signInToComment')}
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <Button variant="outline" onClick={() => navigate("/login")} className="gap-2">
                                        {t('auth:login.signIn')}
                                    </Button>
                                    <Button onClick={() => setLoginModalOpen(true)} className="gap-2">
                                        {t('auth:register.createAccount')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {user && (
                            <CommentForm
                                postId={post.id}
                                postLocked={post.locked}
                                onCommentSubmitted={() => {
                                    window.location.reload();
                                }}
                            />
                        )}

                        <Comments
                            postId={post.id}
                            postLocked={post.locked}
                        />
                    </main>
                </div>
            </div>

            <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
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
