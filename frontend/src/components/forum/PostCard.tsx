import { useMemo } from "react";
import { Pin, PinOff, MessageSquare, Eye, Lock, Pencil, Trash2, FolderTree, ArrowUp, ArrowDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { highlightText } from "@/lib/highlight";
import { parseMarkdownPreview } from "@/lib/markdown";

interface PostTag {
  id: string;
  name: string;
}

interface PostAuthor {
  id?: string;
  name: string;
  avatar?: string;
  username?: string;
  isAdmin?: boolean;
}

interface PostCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

interface Post {
  id: string;
  title: string;
  excerpt: string;
  author: PostAuthor;
  createdAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
  category?: PostCategory;
  tags: PostTag[];
  replyCount: number;
  viewCount: number;
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  userVote?: number;
}

interface PostCardProps {
  post: Post;
  showAdminActions?: boolean;
  searchQuery?: string;
  onPin?: () => void;
  onLock?: () => void;
  onEdit?: () => void;
  onDeleteClick?: () => void;
  onPostClick?: () => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
  onTagClick?: (tagName: string) => void;
}

export function PostCard({
  post,
  showAdminActions = false,
  searchQuery,
  onPin,
  onLock,
  onEdit,
  onDeleteClick,
  onPostClick,
  onUpvote,
  onDownvote,
  onTagClick,
}: PostCardProps) {
  const navigate = useNavigate();

  // Parse markdown for preview (memoized for performance)
  const parsedExcerpt = useMemo(() => {
    const mdHtml = parseMarkdownPreview(post.excerpt);
    // Apply search highlighting on the parsed markdown
    return highlightText(mdHtml, searchQuery || "");
  }, [post.excerpt, searchQuery]);

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Author click - username:", post.author.username);
    if (post.author.username) {
      console.log("Navigating to:", `/profile/${post.author.username}`);
      window.location.href = `/profile/${post.author.username}`;
    }
  };

  return (
    <div
      className={`group relative bg-card rounded-lg p-3 md:p-4 transition-all ${
        post.isPinned
          ? "border-white border-2 shadow-lg shadow-white/10"
          : "border border-border hover:border-primary/30"
      } ${onPostClick ? 'cursor-pointer' : ''}`}
      onClick={onPostClick}
    >
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpvote?.();
            }}
            className={`p-1 rounded transition-colors ${
              post.userVote === 1
                ? 'text-green-500 hover:bg-green-500/10'
                : 'text-muted-foreground hover:text-green-500 hover:bg-green-500/10'
            }`}
            title="Upvote"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium min-w-[1.5rem] text-center">
            {post.totalVotes}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownvote?.();
            }}
            className={`p-1 rounded transition-colors ${
              post.userVote === -1
                ? 'text-red-500 hover:bg-red-500/10'
                : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
            }`}
            title="Downvote"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        </div>

        <div
          onClick={handleAuthorClick}
          className="shrink-0 hidden sm:block cursor-pointer"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback className="bg-teal-600 text-white">
              {post.author.name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {post.category && (
              <Badge 
                variant="outline" 
                className="text-xs gap-1"
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
            {post.isPinned && (
              <Badge variant="outline" className="text-xs gap-1 bg-secondary">
                <Pin className="h-3 w-3" />
                <span className="hidden sm:inline">Pinned</span>
              </Badge>
            )}
          </div>

          <h3 
            className="text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: highlightText(post.title, searchQuery || "")
            }}
          />

          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <div
                onClick={handleAuthorClick}
                className="sm:hidden cursor-pointer"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback className="bg-teal-600 text-white text-xs">
                    {post.author.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <button
                onClick={handleAuthorClick}
                className="hover:text-primary transition-colors"
                dangerouslySetInnerHTML={{
                  __html: highlightText(post.author.name, searchQuery || "")
                }}
              />
              {post.author.username && (
                <span 
                  className="text-xs text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(`(@${post.author.username})`, searchQuery || "")
                  }}
                />
              )}
            </span>
            {post.author.isAdmin && (
              <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-500 border-0">
                <svg className="h-3 w-3 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </Badge>
            )}
            <span>•</span>
            <span className="text-xs">{post.createdAt}</span>
          </div>

          <p 
            className="text-sm text-muted-foreground mt-2 line-clamp-2 markdown-preview-excerpt"
            dangerouslySetInnerHTML={{
              __html: parsedExcerpt
            }}
          />

          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs font-normal hover:bg-secondary/80 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag.name);
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">{post.replyCount}</span>
                <span className="sm:hidden">{post.replyCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">{post.viewCount}</span>
                <span className="sm:hidden">{post.viewCount}</span>
              </div>
            </div>
          </div>

          {showAdminActions && (
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border overflow-x-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
                onClick={(e) => { e.stopPropagation(); onPin?.(); }}
              >
                {post.isPinned ? (
                  <>
                    <PinOff className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Unpin</span>
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Pin</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
                onClick={(e) => { e.stopPropagation(); onLock?.(); }}
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
                onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={(e) => { e.stopPropagation(); onDeleteClick?.(); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { Post, PostAuthor, PostTag, PostCategory };
