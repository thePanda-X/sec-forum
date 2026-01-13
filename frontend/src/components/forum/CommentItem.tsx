import { Calendar, MessageSquare, MoreVertical, Trash2, Edit3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function formatDistanceToNow(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

export interface CommentAuthor {
    id: string;
    email: string;
    displayName?: string;
    username?: string;
}

export interface CommentData {
    id: string;
    body: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
    author: CommentAuthor;
}

interface CommentItemProps {
    comment: CommentData;
    currentUser?: { id: string; role: string };
    onEdit?: (commentId: string) => void;
    onDelete?: (commentId: string) => void;
    onReply?: (commentId: string) => void;
    isReply?: boolean;
    isEditing?: boolean;
    replyingTo?: boolean;
}

export function CommentItem({ comment, currentUser, onEdit, onDelete, onReply, isReply = false, isEditing = false, replyingTo = false }: CommentItemProps) {
    const canEdit = currentUser && (comment.author.id === currentUser.id || ["admin", "moderator"].includes(currentUser.role?.toLowerCase()));
    const isEdited = new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime() + 1000;

    return (
        <div className={`${isReply ? "ml-12 mt-3" : ""}`}>
            <div className="flex gap-3">
                <div
                    onClick={() => {
                        if (comment.author.username) {
                            window.location.href = `/profile/${comment.author.username}`;
                        }
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                >
                    <Avatar className={`${isReply ? "h-7 w-7" : "h-10 w-10"}`}>
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-teal-600 text-white">
                            {comment.author.displayName?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => {
                                        if (comment.author.username) {
                                            window.location.href = `/profile/${comment.author.username}`;
                                        }
                                    }}
                                    className="font-medium hover:text-primary transition-colors text-sm"
                                >
                                    {comment.author.displayName || "Unknown User"}
                                </button>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                                {isEdited && (
                                    <span className="text-xs text-muted-foreground">(edited)</span>
                                )}
                            </div>
                            <div className="mt-1 text-sm text-foreground break-words whitespace-pre-wrap">
                                {comment.body}
                            </div>
                        </div>
                        {!isReply && !isEditing && !replyingTo && currentUser && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-muted-foreground hover:text-primary"
                                onClick={() => onReply?.(comment.id)}
                            >
                                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                Reply
                            </Button>
                        )}
                        {canEdit && (
                            <div className="flex gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => onEdit?.(comment.id)}
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => onDelete?.(comment.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
