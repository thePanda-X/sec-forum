import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/forum/MarkdownEditor";
import { Header } from "@/components/forum/Header";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "/api/v1";

interface Tag {
  id: number;
  name: string;
}

export function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingTags, setIsFetchingTags] = useState(true);

  const headerUser = user
    ? {
        name: user.name,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        avatar: user.avatar,
        isAdmin: user.role === "admin",
      }
    : undefined;

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

      navigate("/");
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
    <div className="min-h-screen bg-background">
      <Header user={headerUser} />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-4 md:mb-6 gap-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="bg-card border rounded-lg p-4 md:p-6">
            <h1 className="text-xl md:text-2xl font-bold mb-2">Create New Post</h1>
            <p className="text-sm text-muted-foreground mb-4 md:mb-6">
              Share your thoughts with the community. You can use markdown for formatting.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
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
                    minHeight="200px"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Tags</Label>
                  {isFetchingTags ? (
                    <p className="text-sm text-muted-foreground">
                      Loading tags...
                    </p>
                  ) : tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-2.5 py-1 text-xs md:text-sm rounded-full border transition-colors ${
                            isTagSelected(tag.id)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted"
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tags available
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Post"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
