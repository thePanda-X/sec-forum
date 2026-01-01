import { useState } from "react";
import { Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "./Header";
import { CategorySidebar } from "./CategorySidebar";
import { PostCard, type Post } from "./PostCard";
import { ForumStatsSidebar } from "./ForumStatsSidebar";
import { FilterDropdown, type SortOption } from "./FilterDropdown";

const mockPosts: Post[] = [
  {
    id: "1",
    title: "Critical RCE vulnerability discovered in popular enterprise software",
    excerpt:
      "A new critical remote code execution vulnerability has been discovered affecting multiple enterprise applications. CVE-2024-XXXX allows unauthenticated attackers to execute arbitra...",
    author: {
      name: "admin",
      isAdmin: true,
    },
    createdAt: "about 1 year ago",
    isPinned: true,
    tags: [
      { id: "1", name: "Threat Intelligence" },
      { id: "2", name: "CVE" },
      { id: "3", name: "RCE" },
    ],
    replyCount: 47,
    viewCount: 1245,
  },
  {
    id: "2",
    title: "Post-quantum cryptography: Preparing for the quantum threat",
    excerpt:
      "With quantum computing advances, current encryption standards face obsolescence. Let's discuss NIST's post-quantum standards and migration strategies that every security profession...",
    author: {
      name: "admin",
      isAdmin: true,
    },
    createdAt: "about 1 year ago",
    isPinned: true,
    tags: [
      { id: "4", name: "Cryptography" },
      { id: "5", name: "Quantum" },
      { id: "6", name: "PQC" },
    ],
    replyCount: 42,
    viewCount: 987,
  },
  {
    id: "3",
    title: "Best practices for API security testing in 2025",
    excerpt:
      "With the rise of microservices architecture, API security has become more critical than ever. In this post, I'll share my methodology for comprehensive API security assessments tha...",
    author: {
      name: "user",
    },
    createdAt: "about 1 year ago",
    isPinned: false,
    tags: [
      { id: "7", name: "API" },
      { id: "8", name: "Testing" },
      { id: "9", name: "Best Practices" },
    ],
    replyCount: 28,
    viewCount: 654,
  },
  {
    id: "4",
    title: "Analyzing the latest Emotet botnet campaign",
    excerpt:
      "The Emotet botnet has resurfaced with new evasion techniques and delivery mechanisms. This analysis covers the technical details of the latest campaign and indicators of compromise...",
    author: {
      name: "MalwareHunter",
    },
    createdAt: "about 1 year ago",
    isPinned: false,
    tags: [
      { id: "10", name: "Malware Analysis" },
      { id: "11", name: "Emotet" },
      { id: "12", name: "Botnet" },
    ],
    replyCount: 35,
    viewCount: 892,
  },
  {
    id: "5",
    title: "OSCP vs OSEP: Which certification path should you choose?",
    excerpt:
      "Deciding between offensive security certifications can be challenging. Here's my breakdown of both certifications, the skills they test, and which one might be right for your career...",
    author: {
      name: "CertHunter",
    },
    createdAt: "about 1 year ago",
    isPinned: false,
    tags: [
      { id: "13", name: "Career & Certifications" },
      { id: "14", name: "OSCP" },
      { id: "15", name: "OSEP" },
    ],
    replyCount: 56,
    viewCount: 1432,
  },
];

// Toggle this to test admin vs regular user view
const currentUser = {
  name: "admin",
  role: "Admin",
  isAdmin: true,
};

export function MainForum() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  const isAdmin = currentUser.isAdmin;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header user={currentUser} notificationCount={3} />

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
                  {mockPosts.length} posts
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
            <div className="space-y-4">
              {mockPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  showAdminActions={isAdmin}
                />
              ))}
            </div>
          </main>

          {/* Right Sidebar - Stats */}
          <ForumStatsSidebar />
        </div>
      </div>
    </div>
  );
}
