import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Shield, Loader2, Trash2, ChevronLeft, ChevronRight, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "./Header";
import { CategorySidebar, type Category } from "./CategorySidebar";
import { PostCard, type Post } from "./PostCard";
import { ForumStatsSidebar } from "./ForumStatsSidebar";
import { FilterDropdown, type SortOption } from "./FilterDropdown";
import { LoginModal } from "@/components/auth/LoginModal";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "/api/v1";

const sortMap: Record<SortOption, string> = {
    recent: "recent",
    popular: "popular",
    "most-replies": "most-replies",
    oldest: "oldest",
    trending: "trending",
    unanswered: "unanswered",
};

export function MainForum() {
    const { t } = useTranslation(['forum', 'common']);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedCategory = searchParams.get('category') || undefined;
    const selectedTag = searchParams.get('tag') || undefined;
    const searchQuery = searchParams.get('search') || undefined;
    const sortParam = searchParams.get('sort') as SortOption || 'recent';

    const [sortOption, setSortOption] = useState<SortOption>(sortParam);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPosts, setTotalPosts] = useState(0);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);
    const [showCategories, setShowCategories] = useState(true);
    const [showStats, setShowStats] = useState(true);
    const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
    const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
    const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    const isAdmin = user?.role === "admin";

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

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set("sort", sortMap[sortOption]);
            if (selectedCategory) {
                params.set("category", selectedCategory);
            }
            if (selectedTag) {
                const tags = await fetch(`${API_BASE}/tags`, {
                    credentials: "include",
                });
                if (tags.ok) {
                    const tagsData = await tags.json();
                    const tag = tagsData.find((t: any) => t.name.toLowerCase() === selectedTag.toLowerCase());
                    if (tag) {
                        params.set("tagId", String(tag.id));
                    }
                }
            }
            if (searchQuery) {
                params.set("search", searchQuery);
            }

            const response = await fetch(`${API_BASE}/posts?${params.toString()}`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch posts");
            }

            const data = await response.json();

            const mappedPosts: Post[] = (data.posts || data).map((post: any) => ({
                id: post.id,
                title: post.title,
                excerpt: post.excerpt || post.body?.substring(0, 150) + "..." || "",
                author: {
                    id: post.author?.id,
                    name: post.author?.displayName || post.author?.name || post.author?.username || "Unknown",
                    avatar: post.author?.avatar,
                    username: post.author?.username,
                    isAdmin: post.author?.role === "admin",
                },
                createdAt: formatRelativeTime(post.createdAt),
                isPinned: post.isPinned || post.pinned || false,
                isLocked: post.isLocked || post.locked || false,
                category: post.category ? {
                    id: post.category.id,
                    name: post.category.name,
                    slug: post.category.slug,
                    color: post.category.color,
                    icon: post.category.icon,
                } : undefined,
                tags: (post.tags || []).map((tag: any) => ({
                    id: tag.id || tag,
                    name: tag.name || tag,
                })),
                replyCount: post.replyCount || post.commentCount || 0,
                viewCount: post.viewCount || post.views || 0,
                upvotes: post.upvotes || 0,
                downvotes: post.downvotes || 0,
                totalVotes: post.totalVotes || 0,
                userVote: post.userVote || 0,
            }));

            const sortedPosts = [...mappedPosts].sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return 0;
            });

            const visiblePosts = sortedPosts.filter(post => !post.isLocked);

            setPosts(visiblePosts);
            setTotalPosts(data.total || mappedPosts.length);
        } catch (err) {
            console.error("Failed to fetch posts:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch posts");
        } finally {
            setIsLoading(false);
        }
    }, [sortOption, selectedCategory, selectedTag, searchQuery]);

    useEffect(() => {
        setSortOption(sortParam);
    }, [sortParam]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePinPost = async (postId: string) => {
        try {
            const response = await fetch(`${API_BASE}/posts/${postId}/pin`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                const post = posts.find(p => p.id === postId);
                const isPinned = post?.isPinned;
                toast.success(isPinned ? t('toast.postUnpinned') : t('toast.postPinned'), {
                    description: isPinned ? t('toast.postUnpinnedDesc') : t('toast.postPinnedDesc'),
                });
                fetchPosts();
            } else {
                toast.error(t('toast.updatePostFailed'), {
                    description: t('toast.updatePostFailedDesc'),
                });
            }
        } catch (err) {
            console.error("Failed to pin post:", err);
            toast.error(t('toast.updatePostFailed'), {
                description: t('toast.updatePostFailedDesc'),
            });
        }
    };

    const handleLockPost = async (postId: string) => {
        try {
            const response = await fetch(`${API_BASE}/posts/${postId}/lock`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                const post = posts.find(p => p.id === postId);
                const isLocked = post?.isLocked;
                toast.success(isLocked ? t('toast.postUnlocked') : t('toast.postLocked'), {
                    description: isLocked ? t('toast.postUnlockedDesc') : t('toast.postLockedDesc'),
                });
                fetchPosts();
            } else {
                toast.error(t('toast.updatePostFailed'), {
                    description: t('toast.updatePostFailedDesc'),
                });
            }
        } catch (err) {
            console.error("Failed to lock post:", err);
            toast.error(t('toast.updatePostFailed'), {
                description: t('toast.updatePostFailedDesc'),
            });
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            const response = await fetch(`${API_BASE}/posts/${postId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (response.ok) {
                setDeleteModalOpen(false);
                setPostToDelete(null);
                toast.success(t('toast.postDeleted'), {
                    description: t('toast.postDeletedDesc'),
                });
                fetchPosts();
            } else {
                toast.error(t('toast.deletePostFailed'), {
                    description: t('toast.deletePostFailedDesc'),
                });
            }
        } catch (err) {
            console.error("Failed to delete post:", err);
            toast.error(t('toast.deletePostFailed'), {
                description: t('toast.deletePostFailedDesc'),
            });
        }
    };

    const handleUpvote = async (postId: string) => {
        if (!user) {
            setLoginModalOpen(true);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/posts/${postId}/upvote`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                fetchPosts();
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

    const handleDownvote = async (postId: string) => {
        if (!user) {
            setLoginModalOpen(true);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/posts/${postId}/downvote`, {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                fetchPosts();
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

    const openDeleteModal = (post: Post) => {
        setPostToDelete(post);
        setDeleteModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header user={headerUser} />

            <div className="container mx-auto px-4 py-6">
                <div className="flex gap-6">
                    <CategorySidebar
                        selectedCategory={selectedCategory}
                        onSelectCategory={(category) => {
                            const params = new URLSearchParams(searchParams);
                            if (category) {
                                params.set('category', category);
                            } else {
                                params.delete('category');
                            }
                            setSearchParams(params);
                            setMobileCategoriesOpen(false);
                        }}
                        className={`${showCategories ? "md:block" : "hidden"} hidden lg:block shrink-0 lg:w-64`}
                    />

                    <main className="flex-1 min-w-0 pb-16 md:pb-6">
                        {isAdmin && (
                            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-border bg-card">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground hidden sm:inline">
                                    {t('posts.adminMode')}
                                </span>
                                <span className="text-sm text-muted-foreground sm:hidden">
                                    {t('posts.adminModeShort', 'Admin Mode')}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold">
                                    {searchQuery ? t('posts.searchTitle', { query: searchQuery }) : selectedTag ? `#${selectedTag}` : selectedCategory ? t('posts.categoryTitle') : t('posts.title')}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {t('posts.count', { count: totalPosts })}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {(selectedCategory || selectedTag || searchQuery) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.delete('category');
                                            params.delete('tag');
                                            params.delete('search');
                                            setSearchParams(params);
                                        }}
                                    >
                                        {t('common:clearAll')}
                                    </Button>
                                )}
                                <FilterDropdown
                                    value={sortOption}
                                    onChange={(value) => {
                                        const params = new URLSearchParams(searchParams);
                                        params.set('sort', value);
                                        setSearchParams(params);
                                    }}
                                />
                                <Button
                                    className="gap-2"
                                    onClick={() => {
                                        if (user) {
                                            navigate("/new-post");
                                        } else {
                                            setLoginModalOpen(true);
                                        }
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t('header.newPost')}</span>
                                </Button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-destructive">{error}</p>
                                <Button
                                    variant="outline"
                                    onClick={fetchPosts}
                                    className="mt-4"
                                >
                                    {t('common:tryAgain')}
                                </Button>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">{t('posts.noResults')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        showAdminActions={isAdmin}
                                        searchQuery={searchQuery}
                                        onPin={() => handlePinPost(post.id)}
                                        onLock={() => handleLockPost(post.id)}
                                        onDeleteClick={() => openDeleteModal(post)}
                                        onPostClick={() => navigate(`/post/${post.id}`)}
                                        onUpvote={() => handleUpvote(post.id)}
                                        onDownvote={() => handleDownvote(post.id)}
                                        onTagClick={(tagName) => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set('tag', tagName);
                                            setSearchParams(params);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </main>

                    <ForumStatsSidebar
                        className={`${showStats ? "md:block" : "hidden"} hidden lg:block shrink-0`}
                        selectedTag={selectedTag}
                        onTagClick={(tagName) => {
                            const params = new URLSearchParams(searchParams);
                            params.set('tag', tagName);
                            setSearchParams(params);
                        }}
                    />
                </div>
            </div>

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            {t('deletePost.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('deletePost.confirmation')}
                        </DialogDescription>
                    </DialogHeader>
                    {postToDelete && (
                        <div className="py-4">
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="font-medium">{postToDelete.title}</p>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {postToDelete.excerpt}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            {t('common:cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => postToDelete && handleDeletePost(postToDelete.id)}
                        >
                            {t('common:delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BottomSheet
                open={mobileCategoriesOpen}
                onOpenChange={setMobileCategoriesOpen}
                title={t('categories.title')}
            >
                <CategorySidebar
                    selectedCategory={selectedCategory}
                    onSelectCategory={(category) => {
                        const params = new URLSearchParams(searchParams);
                        if (category) {
                            params.set('category', category);
                        } else {
                            params.delete('category');
                        }
                        setSearchParams(params);
                        setMobileCategoriesOpen(false);
                    }}
                    isBottomSheet={true}
                />
            </BottomSheet>

            <BottomSheet
                open={mobileStatsOpen}
                onOpenChange={setMobileStatsOpen}
                title={t('stats.title')}
            >
                <ForumStatsSidebar
                    selectedTag={selectedTag}
                    onTagClick={(tagName) => {
                        const params = new URLSearchParams(searchParams);
                        params.set('tag', tagName);
                        setSearchParams(params);
                    }}
                    isBottomSheet={true}
                />
            </BottomSheet>

            <BottomSheet
                open={mobileNotificationsOpen}
                onOpenChange={setMobileNotificationsOpen}
                title={t('notifications.title')}
            >
                <NotificationsDropdown />
            </BottomSheet>

            <MobileBottomNav
                onCategoriesClick={() => setMobileCategoriesOpen(true)}
                onNotificationsClick={() => setMobileNotificationsOpen(true)}
            />

            <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
        </div>
    );
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return "just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks}w ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `about ${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `about ${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
}
