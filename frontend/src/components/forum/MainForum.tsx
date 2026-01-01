import { useState, useEffect, useCallback } from "react";
import { Plus, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "./Header";
import { CategorySidebar } from "./CategorySidebar";
import { PostCard, type Post } from "./PostCard";
import { ForumStatsSidebar } from "./ForumStatsSidebar";
import { FilterDropdown, type SortOption } from "./FilterDropdown";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "/api/v1";

// Map API sort options to backend expected values
const sortMap: Record<SortOption, string> = {
  recent: "recent",
  popular: "popular",
  "most-replies": "replies",
  oldest: "oldest",
};

export function MainForum() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPosts, setTotalPosts] = useState(0);

  const isAdmin = user?.role === "admin";

  // Map auth user to header user format
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

      // Map API response to Post format
      const mappedPosts: Post[] = (data.posts || data).map((post: any) => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt || post.content?.substring(0, 150) + "..." || "",
        author: {
          name: post.author?.username || post.author?.name || "Unknown",
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

  // Handle post actions
  const handlePinPost = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/pin`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts
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
        fetchPosts(); // Refresh posts
      }
    } catch (err) {
      console.error("Failed to lock post:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header user={headerUser} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Categories */}
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Admin Mode Banner */}
            {isAdmin && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-border bg-card">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Admin Mode Active — You can pin, lock, edit, and delete posts
                </span>
              </div>
            )}

            {/* Title and Actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">All Discussions</h1>
                <p className="text-sm text-muted-foreground">
                  {totalPosts} posts
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FilterDropdown value={sortOption} onChange={setSortOption} />
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
              </div>
            </div>

            {/* Posts List */}
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
                    onDelete={() => handleDeletePost(post.id)}
                  />
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar - Stats */}
          <ForumStatsSidebar />
        </div>
      </div>
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
