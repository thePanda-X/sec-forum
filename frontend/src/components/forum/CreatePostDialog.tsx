import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "./MarkdownEditor";
import { Loader2, Plus } from "lucide-react";

const API_BASE = "/api/v1";

interface Tag {
  id: number;
  name: string;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePostDialogProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingTags, setIsFetchingTags] = useState(true);
  const [tagSearch, setTagSearch] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const showCreateOption = tagSearch.trim() && !filteredTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase());

  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open]);

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE}/tags`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || data);
      }
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    } finally {
      setIsFetchingTags(false);
    }
  };

  const createTag = async () => {
    const tagName = tagSearch.trim();
    if (!tagName) return;

    setIsCreatingTag(true);
    try {
      const response = await fetch(`${API_BASE}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: tagName }),
      });

      if (response.ok) {
        const data = await response.json();
        setTags((prev) => [...prev, data.tag]);
        setSelectedTags((prev) => [...prev, data.tag.id]);
        setTagSearch("");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create tag");
      }
    } catch (err) {
      console.error("Failed to create tag:", err);
      setError("Failed to create tag");
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!body.trim()) {
      setError("Post content is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          tagIds: selectedTags,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create post");
      }

      setTitle("");
      setBody("");
      setSelectedTags([]);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const isTagSelected = (tagId: number) => selectedTags.includes(tagId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] md:max-w-[1200px] lg:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts with the community. You can use markdown for
              formatting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                disabled={isLoading}
                maxLength={200}
              />
            </div>
            <div className="grid gap-2">
              <Label>Content</Label>
              <MarkdownEditor
                value={body}
                onChange={setBody}
                placeholder="Write your post content here..."
                minHeight="250px"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tags</Label>
              {isFetchingTags ? (
                <p className="text-sm text-muted-foreground">Loading tags...</p>
              ) : (
                <>
                  <Input
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Search or create tags..."
                    maxLength={50}
                    className="mb-2"
                  />
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          isTagSelected(tag.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                    {filteredTags.length === 0 && !showCreateOption && (
                      <p className="text-sm text-muted-foreground">No matching tags</p>
                    )}
                    {showCreateOption && (
                      <button
                        type="button"
                        onClick={createTag}
                        disabled={isCreatingTag}
                        className="px-3 py-1 text-sm rounded-full border border-dashed border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                      >
                        {isCreatingTag ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Create "{tagSearch}"
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {tags.length === 0 && filteredTags.length === 0 && !showCreateOption && (
                    <p className="text-sm text-muted-foreground">No tags available</p>
                  )}
                </>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
