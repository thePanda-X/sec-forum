import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "./MarkdownEditor";
import { Loader2, Plus, X, Sparkles, Tag as TagIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE = "/api/v1";

interface Tag {
  id: number;
  name: string;
}

interface Category {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  postCount: number;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingTags, setIsFetchingTags] = useState(true);
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [tagSearch, setTagSearch] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isTagSectionExpanded, setIsTagSectionExpanded] = useState(false);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const showCreateOption = tagSearch.trim() && !filteredTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase());

  useEffect(() => {
    if (open) {
      fetchTags();
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setIsFetchingCategories(true);
    try {
      const response = await fetch(`${API_BASE}/categories`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const categoryList = Array.isArray(data) ? data : data.categories || [];
        const categoriesWithIds = categoryList.map((cat: any) => ({
          ...cat,
          id: String(cat.id)
        }));
        setCategories(categoriesWithIds);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setIsFetchingCategories(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
  };

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
          categoryId: selectedCategoryId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create post");
      }

      setTitle("");
      setBody("");
      setSelectedTags([]);
      setSelectedCategoryId("");
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

  const selectedTagsList = tags.filter(tag => selectedTags.includes(tag.id));

  const removeTag = (tagId: number) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] md:max-w-[1100px] max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create a new post</h2>
              <p className="text-sm text-muted-foreground">Start a conversation with the community</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="dialog-title" className="text-sm font-semibold">Title</Label>
              <Input
                id="dialog-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind?"
                disabled={isLoading}
                maxLength={200}
                className="text-base h-12"
              />
              <p className="text-xs text-muted-foreground text-right">
                {title.length}/200
              </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-category" className="text-sm font-semibold">Category</Label>
                <Select 
                  value={selectedCategoryId} 
                  onValueChange={handleCategoryChange} 
                  disabled={isLoading || isFetchingCategories}
                >
                  <SelectTrigger id="dialog-category">
                    <SelectValue placeholder={isFetchingCategories ? "Loading categories..." : "Select a category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-muted-foreground">No categories available</div>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedCategoryId && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
              <Label className="text-sm font-semibold">Content</Label>
              <MarkdownEditor
                value={body}
                onChange={setBody}
                placeholder="Share your thoughts, questions, or ideas..."
                minHeight="250px"
              />
            </div>

            <div className="space-y-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsTagSectionExpanded(!isTagSectionExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Tags
                    {selectedTags.length > 0 && (
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {selectedTags.length}
                      </span>
                    )}
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isLoading}
                >
                  {isTagSectionExpanded ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <svg className="h-4 w-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Button>
              </div>

              {isTagSectionExpanded && (
                <div className="space-y-3 pt-2">
                  {selectedTagsList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTagsList.map((tag) => (
                        <div
                          key={tag.id}
                          className="group flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary border border-primary/20"
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => removeTag(tag.id)}
                            className="opacity-60 group-hover:opacity-100 transition-opacity hover:bg-primary/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {selectedTagsList.length > 1 && (
                        <button
                          type="button"
                          onClick={clearAllTags}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  )}

                  <Input
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder={selectedTagsList.length === 0 ? "Search or create tags..." : "Add more tags..."}
                    maxLength={50}
                    disabled={isCreatingTag}
                  />

                  {isFetchingTags ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading tags...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {filteredTags.length === 0 && !showCreateOption && tagSearch && (
                        <p className="text-sm text-muted-foreground py-2">No matching tags</p>
                      )}
                      {filteredTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                            isTagSelected(tag.id)
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background hover:bg-muted/80 border-border"
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                      {showCreateOption && (
                        <button
                          type="button"
                          onClick={createTag}
                          disabled={isCreatingTag}
                          className="px-3 py-1.5 text-sm rounded-full border-2 border-dashed border-primary bg-primary/5 text-primary hover:bg-primary/10 transition-all flex items-center gap-1.5 font-medium"
                        >
                          {isCreatingTag ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              Create "{tagSearch}"
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        <DialogFooter className="border-t bg-muted/30 p-6 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !title.trim() || !body.trim()} 
            onClick={handleSubmit}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Publish post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
