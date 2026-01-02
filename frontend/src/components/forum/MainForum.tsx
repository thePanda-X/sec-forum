import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Shield, Loader2, Trash2, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
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
import { CategorySidebar } from "./CategorySidebar";
import { PostCard, type Post } from "./PostCard";
import { ForumStatsSidebar } from "./ForumStatsSidebar";
import { FilterDropdown, type SortOption } from "./FilterDropdown";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "/api/v1";

const sortMap: Record<SortOption, string> = {
  recent: "recent",
  popular: "popular",
  "most-replies": "replies",
  oldest: "oldest",
};

export function MainForum() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [sortOption, setSortOption] = useState<SortOption>("recent");
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

  const isAdmin = user?.role === "admin";

  const headerUser = user
    ? {
        name: user.name,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        avatar: user.avatar,
        isAdmin: user.role === "admin",
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
          name: post.author?.displayName || post.author?.name || post.author?.username || "Unknown",
          avatar: post.author?.avatar,
          isAdmin: post.author?.role === "admin",
        },
        createdAt: formatRelativeTime(post.createdAt),
        isPinned: post.isPinned || post.pinned || false,
        tags: (post.tags || []).map((tag: any) => ({
          id: tag.id || tag,
          name: tag.name || tag,
        })),
        replyCount: post.replyCount || post.commentCount || 0,
        viewCount: post.viewCount || post.views || 0,
      }));

      setPosts(mappedPosts);
      setTotalPosts(data.total || mappedPosts.length);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setIsLoading(false);
    }
  }, [sortOption, selectedCategory]);

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
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to pin post:", err);
    }
  };

  const handleLockPost = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/lock`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to lock post:", err);
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
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
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
              setSelectedCategory(category);
              setMobileCategoriesOpen(false);
            }}
            className={`${showCategories ? "md:block" : "hidden"} hidden lg:block shrink-0`}
          />

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileCategoriesOpen(true)}
                className="gap-2"
              >
                <Menu className="h-4 w-4" />
                Categories
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileStatsOpen(true)}
                className="gap-2"
              >
                Stats
              </Button>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-border bg-card">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Admin Mode Active — You can pin, lock, edit, and delete posts
                </span>
                <span className="text-sm text-muted-foreground sm:hidden">
                  Admin Mode Active
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">All Discussions</h1>
                <p className="text-sm text-muted-foreground">
                  {totalPosts} posts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FilterDropdown value={sortOption} onChange={setSortOption} />
                <Button className="gap-2" onClick={() => navigate("/new-post")}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Post</span>
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
                  Try Again
                </Button>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    showAdminActions={isAdmin}
                    onPin={() => handlePinPost(post.id)}
                    onLock={() => handleLockPost(post.id)}
                    onDeleteClick={() => openDeleteModal(post)}
                    onPostClick={() => navigate(`/post/${post.id}`)}
                  />
                ))}
              </div>
            )}
          </main>

          <ForumStatsSidebar className={`${showStats ? "md:block" : "hidden"} hidden lg:block shrink-0`} />
        </div>
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Post
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => postToDelete && handleDeletePost(postToDelete.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mobileCategoriesOpen} onOpenChange={setMobileCategoriesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Categories</DialogTitle>
          </DialogHeader>
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              setMobileCategoriesOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={mobileStatsOpen} onOpenChange={setMobileStatsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forum Stats</DialogTitle>
          </DialogHeader>
          <ForumStatsSidebar />
        </DialogContent>
      </Dialog>
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
