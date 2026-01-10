import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/forum/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconSelector } from '@/components/admin/IconSelector';
import {
    Activity,
    Users,
    FileText,
    Flag,
    FolderTree,
    History,
    Loader2,
    ArrowLeft,
    MoreHorizontal,
    Eye,
    EyeOff,
    Ban,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldClose,
    ShieldOff,
    Trash2,
    Pin,
    Lock,
    Unlock,
    Check,
    X,
    AlertTriangle,
    AlertCircle,
    AlertOctagon,
    Plus,
    Pencil,
    Key,
    Fingerprint,
    LockOpen,
    Wifi,
    WifiOff,
    Server,
    Database,
    HardDrive,
    Terminal,
    Code,
    Code2,
    Bug,
    Search,
    Globe,
    User,
    Users as UsersIcon,
    UserCheck,
    UserX,
    File,
    FileKey,
    CreditCard,
    Bell,
    BellOff,
    Camera,
    Video,
    VideoOff,
    Command,
    Cpu,
    Settings,
    Sliders,
    Brain,
    Cloud,
    CloudLightning,
    CloudOff,
    Link,
    Link2,
    Unlink,
    Mail,
    Timer,
    Zap,
    ZapOff,
    CheckCircle,
    XCircle,
    RefreshCw,
    Copy,
    Download,
    Upload,
    Trash,
    TrendingUp,
    TrendingDown,
    Hexagon,
    Octagon,
    Circle,
    Triangle,
    Radio,
    Radar,
    Crosshair,
    Target,
    MapPin,
    Navigation,
    Navigation2,
    Compass,
    Layers,
    Grid,
    Box,
    Archive,
    Package,
    Chip,
    Router,
    Satellite,
    Signal,
    Network,
    Share,
    Share2,
    GitBranch,
    GitCommit,
    GitMerge,
    GitPullRequest,
    Github,
    Gitlab,
    Binary,
    Hash,
    Award,
    Badge,
    IdCard,
    Headphones,
    Mic,
    MicOff,
    Phone,
    PhoneCall,
    Monitor,
    Laptop,
    Smartphone,
    Tablet,
    Keyboard,
    Mouse,
    MousePointer,
    Crown,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldClose,
    ShieldOff,
    Lock,
    Unlock,
    LockOpen,
    Key,
    Fingerprint,
    Eye,
    EyeOff,
    Wifi,
    WifiOff,
    Server,
    Database,
    HardDrive,
    Terminal,
    Code,
    Code2,
    Bug,
    Search,
    AlertTriangle,
    AlertCircle,
    AlertOctagon,
    Activity,
    Globe,
    User,
    Users: UsersIcon,
    UserCheck,
    UserX,
    File,
    FileText,
    FileKey,
    CreditCard,
    Bell,
    BellOff,
    Camera,
    Video,
    VideoOff,
    Command,
    Cpu,
    Settings,
    Sliders,
    Brain,
    Cloud,
    CloudLightning,
    CloudOff,
    Link,
    Link2,
    Unlink,
    Mail,
    Timer,
    Zap,
    ZapOff,
    Check,
    X,
    CheckCircle,
    XCircle,
    RefreshCw,
    Copy,
    Download,
    Upload,
    Trash,
    TrendingUp,
    TrendingDown,
    Hexagon,
    Octagon,
    Circle,
    Triangle,
    Radio,
    Radar,
    Crosshair,
    Target,
    MapPin,
    Navigation,
    Navigation2,
    Compass,
    Layers,
    Grid,
    Box,
    Archive,
    Package,
    Router,
    Satellite,
    Signal,
    Network,
    Share,
    Share2,
    GitBranch,
    GitCommit,
    GitMerge,
    GitPullRequest,
    Github,
    Gitlab,
    Binary,
    Hash,
    Award,
    Badge,
    IdCard,
    Headphones,
    Mic,
    MicOff,
    Phone,
    PhoneCall,
    Monitor,
    Laptop,
    Smartphone,
    Tablet,
    Keyboard,
    Mouse,
    MousePointer,
    FolderTree,
    History,
    Loader2,
    Flag,
    Pin,
    Ban,
    Pencil,
};

const API_BASE = '/api/v1';

type AdminTab = 'dashboard' | 'users' | 'posts' | 'reports' | 'categories' | 'audit-log';

interface AdminStats {
    totalUsers: number;
    bannedUsers: number;
    totalPosts: number;
    lockedPosts: number;
    pendingReports: number;
    totalReports: number;
    totalCategories: number;
    activeToday: number;
}

interface AdminUser {
    id: string;
    username: string;
    email: string;
    name: string;
    role: 'user' | 'moderator' | 'admin';
    reputation: number;
    createdAt: string;
    avatar?: string;
    isBanned?: boolean;
}

interface AdminPost {
    id: string;
    title: string;
    views: number;
    author: {
        id: string;
        username: string;
        name: string;
        avatar?: string;
    };
    pinned: boolean;
    locked: boolean;
    createdAt: string;
}

interface Report {
    id: string;
    type: 'post' | 'user';
    reason: string;
    description?: string;
    reportedBy?: {
        id: string;
        username: string;
    };
    targetId: string;
    targetTitle?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
    postCount: number;
}

interface AuditLogEntry {
    id: string;
    action: string;
    adminId: string;
    adminUsername: string;
    targetType: string;
    targetId: string;
    targetName?: string;
    createdAt: string;
}

export function AdminPanel() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        bannedUsers: 0,
        totalPosts: 0,
        lockedPosts: 0,
        pendingReports: 0,
        totalReports: 0,
        totalCategories: 0,
        activeToday: 0,
    });
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [posts, setPosts] = useState<AdminPost[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
    const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
    const [reportFilter, setReportFilter] = useState<string>('all');

    // Users pagination, search, and sort
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [userPerPage, setUserPerPage] = useState(10);
    const [userSortColumn, setUserSortColumn] = useState<'name' | 'role' | 'reputation' | 'joined'>('joined');
    const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('desc');

    // Posts pagination, search, and sort
    const [postSearch, setPostSearch] = useState('');
    const [postPage, setPostPage] = useState(1);
    const [postPerPage, setPostPerPage] = useState(10);
    const [postSortColumn, setPostSortColumn] = useState<'title' | 'author' | 'views' | 'created'>('created');
    const [postSortDirection, setPostSortDirection] = useState<'asc' | 'desc'>('desc');

    // Audit log pagination, search, and sort
    const [auditLogSearch, setAuditLogSearch] = useState('');
    const [auditLogPage, setAuditLogPage] = useState(1);
    const [auditLogPerPage, setAuditLogPerPage] = useState(10);
    const [auditLogSortColumn, setAuditLogSortColumn] = useState<'action' | 'admin' | 'date'>('date');
    const [auditLogSortDirection, setAuditLogSortDirection] = useState<'asc' | 'desc'>('desc');

    // Dialog states
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletePostModalOpen, setDeletePostModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<AdminPost | null>(null);
    const [userActionModalOpen, setUserActionModalOpen] = useState(false);
    const [userAction, setUserAction] = useState<'ban' | 'unban' | 'promote' | 'demote' | null>(null);
    const [userToActOn, setUserToActOn] = useState<AdminUser | null>(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: '',
        color: '#10b981',
        icon: 'Shield',
    });

    const headerUser = user ? {
        name: user.name || 'User',
        role: user.role || 'Member',
        avatar: user.avatar,
        isAdmin: user.role === 'admin',
        isModerator: user.role === 'moderator',
        username: user.username,
    } : undefined;

    const tabs = [
        { id: 'dashboard' as const, label: 'Dashboard', icon: Activity },
        { id: 'users' as const, label: 'Users', icon: Users },
        { id: 'posts' as const, label: 'Posts', icon: FileText },
        { id: 'reports' as const, label: 'Reports', icon: Flag, badge: stats.pendingReports },
        { id: 'categories' as const, label: 'Categories', icon: FolderTree },
        { id: 'audit-log' as const, label: 'Audit Log', icon: History },
    ];

    useEffect(() => {
        fetchAdminData();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'posts') fetchPosts();
        else if (activeTab === 'reports') fetchReports();
        else if (activeTab === 'categories') fetchCategories();
        else if (activeTab === 'audit-log') fetchAuditLog();
    }, [activeTab]);

    const fetchAdminData = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/stats`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.stats) {
                    setStats({
                        totalUsers: data.stats.usersCount || 0,
                        bannedUsers: 0,
                        totalPosts: data.stats.postsCount || 0,
                        lockedPosts: 0,
                        pendingReports: data.stats.pendingReports || 0,
                        totalReports: 0,
                        totalCategories: data.stats.categoriesCount || 0,
                        activeToday: 0,
                    });
                } else {
                    setStats(data);
                }
                if (data.recentActivity) {
                    setRecentActivity(data.recentActivity);
                }
            }
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/users`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchPosts = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/posts`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setPosts(data.posts || data);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        }
    };

    const fetchReports = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/reports`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setReports(data.reports || data);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE}/categories`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchAuditLog = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/audit-log`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setAuditLog(data.logs || data);
            }
        } catch (error) {
            console.error('Failed to fetch audit log:', error);
        }
    };

    // User actions
    const handleUserAction = (userId: string, action: 'ban' | 'unban' | 'promote' | 'demote') => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setUserToActOn(user);
            setUserAction(action);
            setUserActionModalOpen(true);
        }
    };

    const executeUserAction = async () => {
        if (!userToActOn || !userAction) return;

        try {
            const response = await fetch(`${API_BASE}/admin/users/${userToActOn.id}/${userAction}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                setUserActionModalOpen(false);
                const actionMessages: Record<string, { title: string; description: string }> = {
                    ban: { title: 'User banned', description: `${userToActOn.name || userToActOn.username} has been banned from the forum.` },
                    unban: { title: 'User unbanned', description: `${userToActOn.name || userToActOn.username} can now access the forum.` },
                    promote: { title: 'User promoted', description: `${userToActOn.name || userToActOn.username} is now a moderator.` },
                    demote: { title: 'User demoted', description: `${userToActOn.name || userToActOn.username} is now a regular user.` },
                };
                toast.success(actionMessages[userAction].title, {
                    description: actionMessages[userAction].description,
                });
                setUserToActOn(null);
                setUserAction(null);
                fetchUsers();
                fetchAdminData();
            } else {
                toast.error(`Failed to ${userAction} user`, {
                    description: 'The action could not be completed.',
                });
            }
        } catch (error) {
            console.error(`Failed to ${userAction} user:`, error);
            toast.error(`Failed to ${userAction} user`, {
                description: 'An error occurred.',
            });
        }
    };

    // Post actions
    const handlePostAction = async (postId: string, action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'delete') => {
        if (action === 'delete') {
            const post = posts.find(p => p.id === postId);
            if (post) {
                setPostToDelete(post);
                setDeletePostModalOpen(true);
            }
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/admin/posts/${postId}/${action}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const actionMessages: Record<string, { title: string; description: string }> = {
                    pin: { title: 'Post pinned', description: 'The post will appear at the top of the forum.' },
                    unpin: { title: 'Post unpinned', description: 'The post has been unpinned.' },
                    lock: { title: 'Post locked', description: 'Comments have been disabled on this post.' },
                    unlock: { title: 'Post unlocked', description: 'Comments are now enabled on this post.' },
                };
                toast.success(actionMessages[action].title, {
                    description: actionMessages[action].description,
                });
                fetchPosts();
                fetchAdminData();
            } else {
                toast.error(`Failed to ${action} post`, {
                    description: 'The action could not be completed.',
                });
            }
        } catch (error) {
            console.error(`Failed to ${action} post:`, error);
            toast.error(`Failed to ${action} post`, {
                description: 'An error occurred.',
            });
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            const response = await fetch(`${API_BASE}/admin/posts/${postId}/delete`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                setDeletePostModalOpen(false);
                setPostToDelete(null);
                toast.success('Post deleted', {
                    description: 'The post has been permanently removed.',
                });
                fetchPosts();
                fetchAdminData();
            } else {
                toast.error('Failed to delete post', {
                    description: 'The post could not be deleted.',
                });
            }
        } catch (error) {
            console.error('Failed to delete post:', error);
            toast.error('Failed to delete post', {
                description: 'An error occurred.',
            });
        }
    };

    // Report actions
    const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'review') => {
        try {
            const response = await fetch(`${API_BASE}/admin/reports/${reportId}/${action}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const actionMessages: Record<string, { title: string; description: string }> = {
                    resolve: { title: 'Report resolved', description: 'The report has been marked as resolved.' },
                    dismiss: { title: 'Report dismissed', description: 'The report has been dismissed.' },
                    review: { title: 'Report reviewed', description: 'The report has been marked for review.' },
                };
                toast.success(actionMessages[action].title, {
                    description: actionMessages[action].description,
                });
                fetchReports();
                fetchAdminData();
            } else {
                toast.error(`Failed to ${action} report`, {
                    description: 'The action could not be completed.',
                });
            }
        } catch (error) {
            console.error(`Failed to ${action} report:`, error);
            toast.error(`Failed to ${action} report`, {
                description: 'An error occurred.',
            });
        }
    };

    // Category actions
    const handleSaveCategory = async () => {
        try {
            const url = editingCategory
                ? `${API_BASE}/admin/categories/${editingCategory.id}`
                : `${API_BASE}/admin/categories`;
            const method = editingCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(categoryForm),
            });

            if (response.ok) {
                setCategoryDialogOpen(false);
                toast.success(editingCategory ? 'Category updated' : 'Category created', {
                    description: editingCategory
                        ? `"${categoryForm.name}" has been updated.`
                        : `"${categoryForm.name}" has been created.`,
                });
                setEditingCategory(null);
                setCategoryForm({ name: '', description: '', color: '#10b981', icon: 'FolderTree' });
                fetchCategories();
                fetchAdminData();
            } else {
                toast.error('Failed to save category', {
                    description: 'The category could not be saved.',
                });
            }
        } catch (error) {
            console.error('Failed to save category:', error);
            toast.error('Failed to save category', {
                description: 'An error occurred.',
            });
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await fetch(`${API_BASE}/admin/categories/${categoryId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('Category deleted', {
                    description: 'The category has been permanently removed.',
                });
                fetchCategories();
                fetchAdminData();
            } else {
                toast.error('Failed to delete category', {
                    description: 'The category could not be deleted.',
                });
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
            toast.error('Failed to delete category', {
                description: 'An error occurred.',
            });
        }
    };

    const openEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            description: category.description,
            color: category.color,
            icon: category.icon,
        });
        setCategoryDialogOpen(true);
    };

    const openNewCategory = () => {
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '', color: '#10b981', icon: 'FolderTree' });
        setCategoryDialogOpen(true);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredReports = reportFilter === 'all'
        ? reports
        : reports.filter(r => r.status === reportFilter);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header user={headerUser} />

            <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Back button and title */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
                                <Shield className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Admin Panel</h1>
                                <p className="text-sm text-muted-foreground">Manage your forum</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6">
                        <div className="hidden md:flex bg-card p-1 rounded-lg border overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                                            activeTab === tab.id
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                        {tab.badge !== undefined && tab.badge > 0 && (
                                            <Badge className="ml-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-primary">
                                                {tab.badge}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="md:hidden">
                            <Select value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select tab" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <SelectItem key={tab.id} value={tab.id}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4" />
                                                    <span>{tab.label}</span>
                                                    {tab.badge !== undefined && tab.badge > 0 && (
                                                        <Badge className="ml-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-primary">
                                                            {tab.badge}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Tab content */}
                    {activeTab === 'dashboard' && (
                        <DashboardTab
                            stats={stats}
                            recentActivity={recentActivity}
                            onNavigate={setActiveTab}
                        />
                    )}

                    {activeTab === 'users' && (
                        <UsersTab
                            users={users}
                            onUserAction={handleUserAction}
                            formatDate={formatDate}
                            navigate={navigate}
                        />
                    )}

                    {activeTab === 'posts' && (
                        <PostsTab
                            posts={posts}
                            onPostAction={handlePostAction}
                            formatDate={formatDate}
                            navigate={navigate}
                        />
                    )}

                    {activeTab === 'reports' && (
                        <ReportsTab
                            reports={filteredReports}
                            reportFilter={reportFilter}
                            setReportFilter={setReportFilter}
                            onReportAction={handleReportAction}
                            formatDate={formatDate}
                        />
                    )}

                    {activeTab === 'categories' && (
                        <CategoriesTab
                            categories={categories}
                            onEditCategory={openEditCategory}
                            onDeleteCategory={handleDeleteCategory}
                            onNewCategory={openNewCategory}
                        />
                    )}

                    {activeTab === 'audit-log' && (
                        <AuditLogTab
                            auditLog={auditLog}
                            formatDate={formatDate}
                        />
                    )}
                </div>
            </div>

            {/* Category Dialog */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit Category' : 'Add Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? 'Update the category details below.'
                                : 'Create a new category for the forum.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={categoryForm.description}
                                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="color">Color</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="color"
                                    id="color"
                                    value={categoryForm.color}
                                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                                    className="h-10 w-14 rounded border border-border cursor-pointer"
                                />
                                <Input
                                    value={categoryForm.color}
                                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="icon">Icon</Label>
                            <div className="mt-1">
                                <IconSelector
                                    value={categoryForm.icon}
                                    onChange={(icon) => setCategoryForm(prev => ({ ...prev, icon }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveCategory} className="bg-green-600 hover:bg-green-700 text-white">
                            {editingCategory ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Post Dialog */}
            <Dialog open={deletePostModalOpen} onOpenChange={setDeletePostModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Delete Post
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {postToDelete && (
                        <div className="py-4">
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="font-medium">{postToDelete.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    By {postToDelete.author.name || postToDelete.author.username}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeletePostModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => postToDelete && handleDeletePost(postToDelete.id)}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Action Dialog */}
            <Dialog open={userActionModalOpen} onOpenChange={setUserActionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {userAction === 'ban' && <Ban className="h-5 w-5 text-destructive" />}
                            {userAction === 'unban' && <Check className="h-5 w-5 text-green-500" />}
                            {userAction === 'promote' && <Shield className="h-5 w-5 text-blue-500" />}
                            {userAction === 'demote' && <Users className="h-5 w-5 text-yellow-500" />}
                            {userAction === 'ban' && 'Ban User'}
                            {userAction === 'unban' && 'Unban User'}
                            {userAction === 'promote' && 'Promote User'}
                            {userAction === 'demote' && 'Demote User'}
                        </DialogTitle>
                        <DialogDescription>
                            {userAction === 'ban' && 'This user will no longer be able to access the forum. This action can be reversed later.'}
                            {userAction === 'unban' && 'This user will regain access to the forum.'}
                            {userAction === 'promote' && `This user will be promoted to moderator and gain additional permissions.`}
                            {userAction === 'demote' && `This user will be demoted to a regular user and lose moderator permissions.`}
                        </DialogDescription>
                    </DialogHeader>
                    {userToActOn && (
                        <div className="py-4">
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="font-medium">{userToActOn.name || userToActOn.username}</p>
                                <p className="text-sm text-muted-foreground mt-1">{userToActOn.email}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Current role: {userToActOn.role.charAt(0).toUpperCase() + userToActOn.role.slice(1)}
                                    {userToActOn.isBanned && ' (Banned)'}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setUserActionModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={userAction === 'ban' ? 'destructive' : 'default'}
                            onClick={executeUserAction}
                            className={userAction === 'promote' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                        >
                            {userAction === 'ban' && 'Ban User'}
                            {userAction === 'unban' && 'Unban User'}
                            {userAction === 'promote' && 'Promote to Moderator'}
                            {userAction === 'demote' && 'Demote to User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Dashboard Tab Component
function DashboardTab({
    stats,
    recentActivity,
    onNavigate,
}: {
    stats: AdminStats;
    recentActivity: AuditLogEntry[];
    onNavigate: (tab: AdminTab) => void;
}) {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Users"
                    value={(stats.totalUsers ?? 0).toString()}
                    subLabel={`${stats.bannedUsers ?? 0} banned`}
                    icon={<Users className="h-4 w-4" />}
                />
                <StatCard
                    label="Total Posts"
                    value={(stats.totalPosts ?? 0).toString()}
                    subLabel={`${stats.lockedPosts ?? 0} locked`}
                    icon={<FileText className="h-4 w-4" />}
                    iconBg="bg-blue-500/10"
                    iconColor="text-blue-500"
                />
                <StatCard
                    label="Pending Reports"
                    value={(stats.pendingReports ?? 0).toString()}
                    subLabel={`${stats.totalReports ?? 0} total reports`}
                    icon={<Flag className="h-4 w-4" />}
                    iconBg="bg-yellow-500/10"
                    iconColor="text-yellow-500"
                />
                <StatCard
                    label="Categories"
                    value={(stats.totalCategories ?? 0).toString()}
                    subLabel={`${stats.activeToday ?? 0} active today`}
                    icon={<FolderTree className="h-4 w-4" />}
                    iconBg="bg-green-500/10"
                    iconColor="text-green-500"
                />
            </div>

            {/* Quick Actions and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-card rounded-lg border p-4 md:p-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-3"
                            onClick={() => onNavigate('reports')}
                        >
                            <Flag className="h-4 w-4 mr-2 text-yellow-500" />
                            Review Reports
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-3"
                            onClick={() => onNavigate('users')}
                        >
                            <Users className="h-4 w-4 mr-2 text-blue-500" />
                            Manage Users
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-3"
                            onClick={() => onNavigate('posts')}
                        >
                            <FileText className="h-4 w-4 mr-2 text-purple-500" />
                            Moderate Posts
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-3"
                            onClick={() => onNavigate('categories')}
                        >
                            <Plus className="h-4 w-4 mr-2 text-green-500" />
                            Add Category
                        </Button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-card rounded-lg border p-4 md:p-6">
                    <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {recentActivity.length > 0 ? (
                            recentActivity.slice(0, 5).map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Shield className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{activity.action}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {activity.adminUsername} - Target: {activity.targetName || activity.targetId}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-sm">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    label,
    value,
    subLabel,
    icon,
    iconBg = "bg-primary/10",
    iconColor = "text-primary",
}: {
    label: string;
    value: string;
    subLabel?: string;
    icon: React.ReactNode;
    iconBg?: string;
    iconColor?: string;
}) {
    return (
        <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <div className={cn("h-6 w-6 rounded flex items-center justify-center", iconBg, iconColor)}>
                    {icon}
                </div>
                <span>{label}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
            {subLabel && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {subLabel}
                </div>
            )}
        </div>
    );
}

// Users Tab Component
function UsersTab({
    users,
    onUserAction,
    formatDate,
    navigate,
}: {
    users: AdminUser[];
    onUserAction: (userId: string, action: 'ban' | 'unban' | 'promote' | 'demote') => void;
    formatDate: (date: string) => string;
    navigate: (path: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortColumn, setSortColumn] = useState<'name' | 'role' | 'reputation' | 'joined'>('joined');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const filteredAndSortedUsers = users
        .filter(u => {
            const searchLower = searchQuery.toLowerCase();
            return (
                u.name?.toLowerCase().includes(searchLower) ||
                u.username?.toLowerCase().includes(searchLower) ||
                u.email?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => {
            const direction = sortDirection === 'asc' ? 1 : -1;
            switch (sortColumn) {
                case 'name':
                    return direction * ((a.name || a.username || '').localeCompare(b.name || b.username || ''));
                case 'role':
                    return direction * (a.role.localeCompare(b.role));
                case 'reputation':
                    return direction * ((a.reputation || 0) - (b.reputation || 0));
                case 'joined':
                    return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                default:
                    return 0;
            }
        });

    const totalPages = Math.ceil(filteredAndSortedUsers.length / perPage);
    const paginatedUsers = filteredAndSortedUsers.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const handleSort = (column: 'name' | 'role' | 'reputation' | 'joined') => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    return (
        <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 md:p-6 border-b">
                <h2 className="text-lg font-semibold">User Management</h2>
                <p className="text-muted-foreground text-sm">Manage user accounts and permissions</p>
            </div>

            <div className="p-4 md:p-6 border-b">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Select value={perPage.toString()} onValueChange={(value) => setPerPage(parseInt(value))}>
                        <SelectTrigger className="w-full sm:w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 per page</SelectItem>
                            <SelectItem value="25">25 per page</SelectItem>
                            <SelectItem value="50">50 per page</SelectItem>
                            <SelectItem value="100">100 per page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table header - hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
                <div
                    className="col-span-4 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('name')}
                >
                    User
                    {sortColumn === 'name' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div
                    className="col-span-2 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('role')}
                >
                    Role
                    {sortColumn === 'role' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div
                    className="col-span-2 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('reputation')}
                >
                    Reputation
                    {sortColumn === 'reputation' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div
                    className="col-span-3 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('joined')}
                >
                    Joined
                    {sortColumn === 'joined' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div className="col-span-1">Actions</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-border">
                {paginatedUsers.map((u) => (
                    <div key={u.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-muted/30 transition-colors">
                        {/* User info */}
                        <div className="md:col-span-4 flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={u.avatar} />
                                <AvatarFallback className="bg-teal-600 text-white">
                                    {u.name?.charAt(0).toUpperCase() || u.username?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="font-medium truncate">{u.name || u.username}</p>
                                <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                            </div>
                        </div>

                        {/* Role */}
                        <div className="md:col-span-2 flex items-center">
                            <span className="md:hidden text-muted-foreground text-sm mr-2">Role:</span>
                            {u.isBanned ? (
                                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-destructive/20 text-destructive">
                                    <Ban className="h-4 w-4" />
                                </div>
                            ) : (
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center",
                                    u.role === 'admin' && "bg-amber-500/20 text-amber-500",
                                    u.role === 'moderator' && "bg-blue-500/20 text-blue-500",
                                    u.role === 'user' && "bg-muted text-muted-foreground"
                                )}>
                                    {u.role === 'admin' && <Crown className="h-4 w-4" />}
                                    {u.role === 'moderator' && <Shield className="h-4 w-4" />}
                                    {u.role === 'user' && <User className="h-4 w-4" />}
                                </div>
                            )}
                        </div>

                        {/* Reputation */}
                        <div className="md:col-span-2 flex items-center">
                            <span className="md:hidden text-muted-foreground text-sm mr-2">Reputation:</span>
                            <span className="font-medium">{u.reputation?.toLocaleString() || '0'}</span>
                        </div>

                        {/* Joined */}
                        <div className="md:col-span-3 flex items-center text-sm text-muted-foreground">
                            <span className="md:hidden text-muted-foreground text-sm mr-2">Joined:</span>
                            {u.createdAt ? formatDate(u.createdAt) : '-'}
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-1 flex items-center justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/profile/${u.username}`)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {u.role !== 'admin' && (
                                        <>
                                            {u.role === 'user' && (
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => onUserAction(u.id, 'promote')}
                                                >
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    Promote to Moderator
                                                </DropdownMenuItem>
                                            )}
                                            {u.role === 'moderator' && (
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => onUserAction(u.id, 'demote')}
                                                >
                                                    <Users className="mr-2 h-4 w-4" />
                                                    Demote to User
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            {u.isBanned ? (
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-green-500 focus:text-green-500"
                                                    onClick={() => onUserAction(u.id, 'unban')}
                                                >
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Unban User
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                    onClick={() => onUserAction(u.id, 'ban')}
                                                >
                                                    <Ban className="mr-2 h-4 w-4" />
                                                    Ban User
                                                </DropdownMenuItem>
                                            )}
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}

                {filteredAndSortedUsers.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No users found
                    </div>
                )}
            </div>

            {filteredAndSortedUsers.length > 0 && (
                <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = totalPages <= 5
                                    ? i + 1
                                    : currentPage <= 3
                                        ? i + 1
                                        : currentPage >= totalPages - 2
                                            ? totalPages - 4 + i
                                            : currentPage - 2 + i;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="h-8 w-8 p-0"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Posts Tab Component
function PostsTab({
    posts,
    onPostAction,
    formatDate,
    navigate,
}: {
    posts: AdminPost[];
    onPostAction: (postId: string, action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'delete') => void;
    formatDate: (date: string) => string;
    navigate: (path: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortColumn, setSortColumn] = useState<'title' | 'author' | 'views' | 'created'>('created');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const filteredAndSortedPosts = posts
        .filter(post => {
            const searchLower = searchQuery.toLowerCase();
            return (
                post.title?.toLowerCase().includes(searchLower) ||
                post.author.name?.toLowerCase().includes(searchLower) ||
                post.author.username?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => {
            const direction = sortDirection === 'asc' ? 1 : -1;
            switch (sortColumn) {
                case 'title':
                    return direction * (a.title.localeCompare(b.title));
                case 'author':
                    return direction * ((a.author.name || a.author.username).localeCompare(b.author.name || b.author.username));
                case 'views':
                    return direction * ((a.views || 0) - (b.views || 0));
                case 'created':
                    return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                default:
                    return 0;
            }
        });

    const totalPages = Math.ceil(filteredAndSortedPosts.length / perPage);
    const paginatedPosts = filteredAndSortedPosts.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const handleSort = (column: 'title' | 'author' | 'views' | 'created') => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getStatusBadge = (post: AdminPost) => {
        if (post.pinned && post.locked) {
            return (
                <div className="flex gap-1 text-green-500">
                    <Pin className="h-4 w-4" />
                    <Lock className="h-4 w-4 text-yellow-500" />
                </div>
            );
        } else if (post.pinned) {
            return <Pin className="h-4 w-4 text-green-500" />;
        } else if (post.locked) {
            return <Lock className="h-4 w-4 text-yellow-500" />;
        }
        return null;
    };

    return (
        <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 md:p-6 border-b">
                <h2 className="text-lg font-semibold">Post Management</h2>
                <p className="text-muted-foreground text-sm">Moderate and manage forum posts</p>
            </div>

            <div className="p-4 md:p-6 border-b">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Select value={perPage.toString()} onValueChange={(value) => setPerPage(parseInt(value))}>
                        <SelectTrigger className="w-full sm:w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 per page</SelectItem>
                            <SelectItem value="25">25 per page</SelectItem>
                            <SelectItem value="50">50 per page</SelectItem>
                            <SelectItem value="100">100 per page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table header - hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
                <div
                    className="col-span-5 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('title')}
                >
                    Post
                    {sortColumn === 'title' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div
                    className="col-span-2 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('author')}
                >
                    Author
                    {sortColumn === 'author' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div className="col-span-2">Status</div>
                <div
                    className="col-span-2 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('views')}
                >
                    Views
                    {sortColumn === 'views' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div
                    className="col-span-2 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('created')}
                >
                    Created
                    {sortColumn === 'created' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div className="col-span-1">Actions</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-border">
                {paginatedPosts.map((post) => (
                    <div key={post.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-muted/30 transition-colors">
                        {/* Post info */}
                        <div className="md:col-span-5">
                            <p className="font-medium line-clamp-1">{post.title}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.views?.toLocaleString() || '0'}
                            </p>
                        </div>

                        {/* Author */}
                        <div className="md:col-span-2 flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={post.author.avatar} />
                                <AvatarFallback className="bg-teal-600 text-white text-xs">
                                    {post.author.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{post.author.name || post.author.username}</span>
                        </div>

                        {/* Status */}
                        <div className="md:col-span-2 flex items-center">
                            <span className="md:hidden text-muted-foreground text-sm mr-2">Status:</span>
                            {getStatusBadge(post)}
                        </div>

                        {/* Created */}
                        <div className="md:col-span-2 flex items-center text-sm text-muted-foreground">
                            <span className="md:hidden text-muted-foreground text-sm mr-2">Created:</span>
                            {post.createdAt ? formatDate(post.createdAt) : '-'}
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-1 flex items-center justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/post/${post.id}`)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Post
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {post.pinned ? (
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => onPostAction(post.id, 'unpin')}
                                        >
                                            <Pin className="mr-2 h-4 w-4" />
                                            Unpin Post
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => onPostAction(post.id, 'pin')}
                                        >
                                            <Pin className="mr-2 h-4 w-4" />
                                            Pin Post
                                        </DropdownMenuItem>
                                    )}
                                    {post.locked ? (
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => onPostAction(post.id, 'unlock')}
                                        >
                                            <Unlock className="mr-2 h-4 w-4" />
                                            Unlock Post
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => onPostAction(post.id, 'lock')}
                                        >
                                            <Lock className="mr-2 h-4 w-4" />
                                            Lock Post
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                        onClick={() => onPostAction(post.id, 'delete')}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Post
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}

                {filteredAndSortedPosts.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No posts found
                    </div>
                )}
            </div>

            {filteredAndSortedPosts.length > 0 && (
                <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, filteredAndSortedPosts.length)} of {filteredAndSortedPosts.length} posts
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = totalPages <= 5
                                    ? i + 1
                                    : currentPage <= 3
                                        ? i + 1
                                        : currentPage >= totalPages - 2
                                            ? totalPages - 4 + i
                                            : currentPage - 2 + i;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="h-8 w-8 p-0"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reports Tab Component
function ReportsTab({
    reports,
    reportFilter,
    setReportFilter,
    onReportAction,
    formatDate,
}: {
    reports: Report[];
    reportFilter: string;
    setReportFilter: (filter: string) => void;
    onReportAction: (reportId: string, action: 'resolve' | 'dismiss' | 'review') => void;
    formatDate: (date: string) => string;
}) {
    return (
        <div className="bg-card rounded-lg border">
            <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">Report Management</h2>
                    <p className="text-muted-foreground text-sm">Review and handle user reports</p>
                </div>
                <Select value={reportFilter} onValueChange={setReportFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filter reports" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Reports</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="divide-y divide-border">
                {reports.map((report) => (
                    <div key={report.id} className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    <Badge variant="outline" className="text-xs">
                                        {report.type === 'post' ? 'Post Report' : 'User Report'}
                                    </Badge>
                                    {report.status !== 'pending' && (
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "text-xs ml-auto sm:ml-0",
                                                report.status === 'resolved' && "bg-green-500/20 text-green-400",
                                                report.status === 'reviewed' && "bg-blue-500/20 text-blue-400",
                                                report.status === 'dismissed' && "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {report.status === 'resolved' && <Check className="h-3 w-3 mr-1" />}
                                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                        </Badge>
                                    )}
                                </div>
                                <p className="font-medium text-yellow-500">{report.reason}</p>
                                {report.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                    By {report.reportedBy?.username || 'Anonymous'} - {formatDate(report.createdAt)}
                                </p>
                            </div>

                            {report.status === 'pending' || report.status === 'reviewed' ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onReportAction(report.id, 'review')}
                                        className="text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Review
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onReportAction(report.id, 'resolve')}
                                        className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        Resolve
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onReportAction(report.id, 'dismiss')}
                                        className="text-muted-foreground"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Dismiss
                                    </Button>
                                </div>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "text-xs hidden sm:flex",
                                        report.status === 'resolved' && "bg-green-500/20 text-green-400",
                                        report.status === 'dismissed' && "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {report.status === 'resolved' && <Check className="h-3 w-3 mr-1" />}
                                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                </Badge>
                            )}
                        </div>
                    </div>
                ))}

                {reports.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No reports found
                    </div>
                )}
            </div>
        </div>
    );
}

// Categories Tab Component
function CategoriesTab({
    categories,
    onEditCategory,
    onDeleteCategory,
    onNewCategory,
}: {
    categories: Category[];
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: string) => void;
    onNewCategory: () => void;
}) {
    return (
        <div className="bg-card rounded-lg border">
            <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">Category Management</h2>
                    <p className="text-muted-foreground text-sm">Organize forum topics</p>
                </div>
                <Button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onNewCategory();
                    }}
                    className="bg-white hover:bg-gray-100 text-black"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => {
                        const Icon = iconMap[category.icon] || FolderTree;
                        return (
                            <div
                                key={category.id}
                                className="bg-background rounded-lg border p-4 hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${category.color}20` }}
                                    >
                                        <Icon className="h-5 w-5" style={{ color: category.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3
                                            className="font-semibold text-lg mb-1"
                                            style={{ color: category.color }}
                                        >
                                            {category.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {category.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        {category.postCount} posts
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => onEditCategory(category)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            onClick={() => onDeleteCategory(category.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {categories.length === 0 && (
                        <div className="col-span-full p-8 text-center text-muted-foreground">
                            No categories found. Create your first category!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Audit Log Tab Component
function AuditLogTab({
    auditLog,
    formatDate,
}: {
    auditLog: AuditLogEntry[];
    formatDate: (date: string) => string;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortColumn, setSortColumn] = useState<'action' | 'admin' | 'date'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const filteredAndSortedLog = auditLog
        .filter(entry => {
            const searchLower = searchQuery.toLowerCase();
            return (
                entry.action?.toLowerCase().includes(searchLower) ||
                entry.adminUsername?.toLowerCase().includes(searchLower) ||
                entry.targetName?.toLowerCase().includes(searchLower) ||
                entry.targetId?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => {
            const direction = sortDirection === 'asc' ? 1 : -1;
            switch (sortColumn) {
                case 'action':
                    return direction * (a.action.localeCompare(b.action));
                case 'admin':
                    return direction * (a.adminUsername.localeCompare(b.adminUsername));
                case 'date':
                    return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                default:
                    return 0;
            }
        });

    const totalPages = Math.ceil(filteredAndSortedLog.length / perPage);
    const paginatedLog = filteredAndSortedLog.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const handleSort = (column: 'action' | 'admin' | 'date') => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    return (
        <div className="bg-card rounded-lg border">
            <div className="p-4 md:p-6 border-b">
                <h2 className="text-lg font-semibold">Audit Log</h2>
                <p className="text-muted-foreground text-sm">Track all admin actions</p>
            </div>

            <div className="p-4 md:p-6 border-b">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search audit log..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Select value={perPage.toString()} onValueChange={(value) => setPerPage(parseInt(value))}>
                        <SelectTrigger className="w-full sm:w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 per page</SelectItem>
                            <SelectItem value="25">25 per page</SelectItem>
                            <SelectItem value="50">50 per page</SelectItem>
                            <SelectItem value="100">100 per page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table header - hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
                <div
                    className="col-span-5 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('action')}
                >
                    Action
                    {sortColumn === 'action' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div
                    className="col-span-4 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('admin')}
                >
                    Admin
                    {sortColumn === 'admin' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
                <div
                    className="col-span-3 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => handleSort('date')}
                >
                    Date
                    {sortColumn === 'date' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </div>
            </div>

            <div className="divide-y divide-border">
                {paginatedLog.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:p-6 hover:bg-muted/30 transition-colors">
                        <div className="md:col-span-5 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium line-clamp-1">{entry.action}</p>
                                <p className="text-sm text-muted-foreground truncate md:hidden mt-1">
                                    {entry.adminUsername}
                                </p>
                                <p className="text-sm text-muted-foreground truncate md:hidden">
                                    {formatDate(entry.createdAt)}
                                </p>
                            </div>
                        </div>
                        <div className="md:col-span-4 hidden md:flex items-center text-sm">
                            <span className="md:hidden text-muted-foreground text-sm mr-2">Admin:</span>
                            {entry.adminUsername}
                        </div>
                        <div className="md:col-span-3 hidden md:flex items-center text-sm text-muted-foreground">
                            <span className="md:hidden text-muted-foreground text-sm mr-2">Date:</span>
                            {formatDate(entry.createdAt)}
                        </div>
                    </div>
                ))}

                {filteredAndSortedLog.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No audit log entries found
                    </div>
                )}
            </div>

            {filteredAndSortedLog.length > 0 && (
                <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, filteredAndSortedLog.length)} of {filteredAndSortedLog.length} entries
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = totalPages <= 5
                                    ? i + 1
                                    : currentPage <= 3
                                        ? i + 1
                                        : currentPage >= totalPages - 2
                                            ? totalPages - 4 + i
                                            : currentPage - 2 + i;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="h-8 w-8 p-0"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
