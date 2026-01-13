import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface CommentFormProps {
    postId: string;
    postLocked: boolean;
    onCommentSubmitted: () => void;
}

export function CommentForm({ postId, postLocked, onCommentSubmitted }: CommentFormProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/v1/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ body: content.trim() }),
            });

            if (response.ok) {
                setContent("");
                onCommentSubmitted();
            }
        } catch (error) {
            console.error("Failed to submit comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (postLocked) {
        return (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                Comments are disabled for this post.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-3">
                <div className="flex-1">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write a comment..."
                        rows={3}
                        disabled={isSubmitting}
                        className="resize-y min-h-[80px] max-h-[200px]"
                    />
                </div>
            </div>
            <div className="flex justify-end mt-2">
                <Button
                    type="submit"
                    size="sm"
                    disabled={!content.trim() || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="mr-2">Sending...</span>
                        </>
                    ) : (
                        <>
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Post Comment
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
