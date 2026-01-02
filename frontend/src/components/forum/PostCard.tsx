import { Pin, PinOff, MessageSquare, Eye, Lock, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PostTag {
  id: string;
  name: string;
}

interface PostAuthor {
  name: string;
  avatar?: string;
  isAdmin?: boolean;
}

interface Post {
  id: string;
  title: string;
  excerpt: string;
  author: PostAuthor;
  createdAt: string;
  isPinned?: boolean;
  tags: PostTag[];
  replyCount: number;
  viewCount: number;
}

interface PostCardProps {
  post: Post;
  showAdminActions?: boolean;
  onPin?: () => void;
  onLock?: () => void;
  onEdit?: () => void;
  onDeleteClick?: () => void;
}

export function PostCard({
  post,
  showAdminActions = false,
  onPin,
  onLock,
  onEdit,
  onDeleteClick,
}: PostCardProps) {
  return (
    <article className="group relative bg-card border border-border rounded-lg p-3 md:p-4 hover:border-primary/30 transition-colors">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0 hidden sm:flex">
          <AvatarImage src={post.author.avatar} />
          <AvatarFallback className="bg-teal-600 text-white">
            {post.author.name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {post.isPinned && (
              <Badge variant="outline" className="text-xs gap-1 bg-secondary">
                <Pin className="h-3 w-3" />
                <span className="hidden sm:inline">Pinned</span>
              </Badge>
            )}
          </div>

          <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Avatar className="h-5 w-5 sm:hidden">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback className="bg-teal-600 text-white text-xs">
                  {post.author.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span>{post.author.name}</span>
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

          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs font-normal hover:bg-secondary/80 cursor-pointer"
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
                onClick={onPin}
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
                onClick={onLock}
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={onDeleteClick}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export type { Post, PostAuthor, PostTag };
