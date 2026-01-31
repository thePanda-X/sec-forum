import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MessageSquare, X, Send } from "lucide-react";
import { CommentItem, CommentData } from "./CommentItem";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReplyFormProps {
    postId: string;
    parentId: string;
    onReplySubmitted: () => void;
    onCancel: () => void;
}

function ReplyForm({ postId, parentId, onReplySubmitted, onCancel }: ReplyFormProps) {
    const { t } = useTranslation('forum');
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/v1/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ body: content.trim(), parentId }),
            });

            if (response.ok) {
                setContent("");
                onReplySubmitted();
            }
        } catch (error) {
            console.error("Failed to submit reply:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('comments.placeholder')}
                rows={2}
                disabled={isSubmitting}
                autoFocus
                className="resize-y min-h-[60px] max-h-[150px]"
            />
            <div className="flex gap-2">
                <Button
                    type="submit"
                    size="sm"
                    disabled={!content.trim() || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="mr-2">{t('comments.sending')}</span>
                        </>
                    ) : (
                        <>
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            {t('comments.reply')}
                        </>
                    )}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    <X className="h-3.5 w-3.5 mr-1" />
                    {t('comments.cancel')}
                </Button>
            </div>
        </form>
    );
}

interface CommentsProps {
    postId: string;
    postLocked: boolean;
}

export function Comments({ postId, postLocked }: CommentsProps) {
    const { t } = useTranslation('forum');
    const { user } = useAuth();
    const [comments, setComments] = useState<CommentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [replyingToId, setReplyingToId] = useState<string | null>(null);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/comments/post/${postId}`, {
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const handleDelete = async (commentId: string) => {
        if (!confirm(t('comments.deleteConfirm'))) return;

        try {
            const response = await fetch(`/api/v1/comments/${commentId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (response.ok) {
                setComments((prev) => prev.filter((c) => c.id !== commentId));
            }
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    };

    const handleEdit = (commentId: string) => {
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
            setEditingCommentId(commentId);
            setEditContent(comment.body);
        }
    };

    const handleSaveEdit = async (commentId: string) => {
        try {
            const response = await fetch(`/api/v1/comments/${commentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ body: editContent }),
            });

            if (response.ok) {
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === commentId
                            ? { ...c, body: editContent, updatedAt: new Date().toISOString() }
                            : c
                    )
                );
                setEditingCommentId(null);
                setEditContent("");
            }
        } catch (error) {
            console.error("Failed to edit comment:", error);
        }
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditContent("");
    };

    const handleReply = async (body: string, parentId?: string) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/v1/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ body, parentId }),
            });

            if (response.ok) {
                fetchComments();
                setReplyingToId(null);
            }
        } catch (error) {
            console.error("Failed to post comment:", error);
        }
    };

    const handleReplyClick = (commentId: string) => {
        setReplyingToId(replyingToId === commentId ? null : commentId);
        setEditingCommentId(null);
    };

    const rootComments = comments.filter((c) => !c.parentId);

    return (
        <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">{t('comments.title')}</h3>
                <span className="text-sm text-muted-foreground">({comments.length})</span>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    {t('comments.noComments')}
                </div>
            ) : (
                <div className="space-y-4">
                    {rootComments.map((comment) => {
                        const replies = comments.filter((c) => c.parentId === comment.id);
                        const isEditing = editingCommentId === comment.id;

                        return (
                            <div key={comment.id} className="border-b border-border pb-4 last:border-0">
                                <CommentItem
                                    comment={comment}
                                    currentUser={user ? { id: String(user.id), role: user.role } : undefined}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onReply={handleReplyClick}
                                    isEditing={editingCommentId === comment.id}
                                    replyingTo={replyingToId === comment.id}
                                />

                                {isEditing && (
                                    <div className="ml-12 mt-3 space-y-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                                            placeholder={t('comments.editPlaceholder')}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveEdit(comment.id)}
                                                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                            >
                                                {t('comments.save')}
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                                            >
                                                {t('comments.cancel')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {replyingToId === comment.id && (
                                    <div className="ml-12 mt-3 space-y-2">
                                        <ReplyForm
                                            postId={postId}
                                            parentId={comment.id}
                                            onReplySubmitted={() => {
                                                fetchComments();
                                                setReplyingToId(null);
                                            }}
                                            onCancel={() => setReplyingToId(null)}
                                        />
                                    </div>
                                )}

                                {replies.length > 0 && (
                                    <div className="mt-3">
                                        {replies.map((reply) => {
                                            const isReplyEditing = editingCommentId === reply.id;
                                            return (
                                                <div key={reply.id}>
                                                    <CommentItem
                                                        comment={reply}
                                                        currentUser={user ? { id: String(user.id), role: user.role } : undefined}
                                                        onEdit={handleEdit}
                                                        onDelete={handleDelete}
                                                        onReply={handleReplyClick}
                                                        isReply
                                                        isEditing={isReplyEditing}
                                                    />
                                                    {isReplyEditing && (
                                                        <div className="ml-12 mt-3 space-y-2">
                                                            <textarea
                                                                value={editContent}
                                                                onChange={(e) => setEditContent(e.target.value)}
                                                                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                                                                placeholder={t('comments.editPlaceholder')}
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleSaveEdit(reply.id)}
                                                                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                                                >
                                                                    {t('comments.save')}
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                                                                >
                                                                    {t('comments.cancel')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {replyingToId === reply.id && (
                                                        <div className="ml-12 mt-3 space-y-2">
                                                            <ReplyForm
                                                                postId={postId}
                                                                parentId={reply.id}
                                                                onReplySubmitted={() => {
                                                                    fetchComments();
                                                                    setReplyingToId(null);
                                                                }}
                                                                onCancel={() => setReplyingToId(null)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
