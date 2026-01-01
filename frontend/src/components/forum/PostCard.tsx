import { Pin, PinOff, MessageSquare, Eye, ChevronRight, Lock, Pencil, Trash2 } from "lucide-react";
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
  onDelete?: () => void;
}

export function PostCard({ 
  post, 
  showAdminActions = false,
  onPin,
  onLock,
  onEdit,
  onDelete,
}: PostCardProps) {
  return (
    <article className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Author Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={post.author.avatar} />
          <AvatarFallback className="bg-teal-600 text-white">
            {post.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with Pinned badge */}
          <div className="flex items-center gap-2 mb-1">
            {post.isPinned && (
              <Badge variant="outline" className="text-xs gap-1 bg-secondary">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {post.title}
          </h3>

          {/* Author & Date */}
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span className="text-muted-foreground">
              {post.author.name}
            </span>
            {post.author.isAdmin && (
              <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-500 border-0">
                <svg className="h-3 w-3 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </Badge>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{post.createdAt}</span>
          </div>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {post.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs font-normal hover:bg-secondary/80 cursor-pointer"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{post.replyCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount}</span>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {showAdminActions && (
            <div className="flex items-center gap-1 mt-4 pt-4 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={onPin}
              >
                {post.isPinned ? (
                  <>
                    <PinOff className="h-3.5 w-3.5" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5" />
                    Pin
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={onLock}
              >
                <Lock className="h-3.5 w-3.5" />
                Lock
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </article>
  );
}

export type { Post, PostAuthor, PostTag };
