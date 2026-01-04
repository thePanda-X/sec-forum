import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/forum/Header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Globe,
    Loader2,
    Pencil,
    UserPlus,
    UserMinus,
    Star,
    FileText,
    MessageSquare,
    Shield,
    Eye,
} from 'lucide-react';

const API_BASE = '/api/v1';

type ProfileTab = 'posts' | 'followers' | 'following' | 'activity';

interface UserProfileData {
    id: number;
    email: string;
    role: string;
    displayName: string;
    username: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    githubUsername?: string;
    twitterHandle?: string;
    skills?: string;
    createdAt: string;
    followersCount: number;
    followingCount: number;
}

interface UserPost {
    id: number;
    title: string;
    body: string;
    createdAt: string;
    views?: number;
    tags: { id: number; name: string }[];
    commentCount?: number;
}

interface FollowerUser {
    id: number;
    email: string;
    displayName?: string;
    username?: string;
    avatar?: string;
}

export function UserProfile() {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [posts, setPosts] = useState<UserPost[]>([]);
    const [followers, setFollowers] = useState<FollowerUser[]>([]);
    const [following, setFollowing] = useState<FollowerUser[]>([]);
    const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isOwnProfile = currentUser && profile && String(currentUser.id) === String(profile.id);

    useEffect(() => {
        if (username) {
            fetchProfile();
        }
    }, [username]);

    useEffect(() => {
        if (profile) {
            fetchTabData();
        }
    }, [profile, activeTab]);

    useEffect(() => {
        if (profile && currentUser && !isOwnProfile) {
            checkFollowStatus();
        }
    }, [profile, currentUser]);

    const fetchProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/users/${username}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setError('User not found');
                } else {
                    setError('Failed to load profile');
                }
                return;
            }

            const data = await response.json();
            setProfile(data);
        } catch (err) {
            setError('Failed to load profile');
            console.error('Failed to fetch profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTabData = async () => {
        if (!profile) return;

        try {
            if (activeTab === 'posts') {
                const response = await fetch(`${API_BASE}/users/${username}/posts`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    setPosts(data);
                }
            } else if (activeTab === 'followers') {
                const response = await fetch(`${API_BASE}/users/${username}/followers`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    setFollowers(data);
                }
            } else if (activeTab === 'following') {
                const response = await fetch(`${API_BASE}/users/${username}/following`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    setFollowing(data);
                }
            }
        } catch (err) {
            console.error('Failed to fetch tab data:', err);
        }
    };

    const checkFollowStatus = async () => {
        if (!profile || !currentUser) return;

        try {
            const response = await fetch(`${API_BASE}/users/${username}/followers`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                const isCurrentlyFollowing = data.some(
                    (f: FollowerUser) => String(f.id) === String(currentUser.id)
                );
                setIsFollowing(isCurrentlyFollowing);
            }
        } catch (err) {
            console.error('Failed to check follow status:', err);
        }
    };

    const handleFollow = async () => {
        if (!profile || followLoading) return;

        setFollowLoading(true);
        try {
            const response = await fetch(`${API_BASE}/users/${username}/follow`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                setIsFollowing(true);
                setProfile(prev => prev ? {
                    ...prev,
                    followersCount: prev.followersCount + 1
                } : null);
            }
        } catch (err) {
            console.error('Failed to follow user:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleUnfollow = async () => {
        if (!profile || followLoading) return;

        setFollowLoading(true);
        try {
            const response = await fetch(`${API_BASE}/users/${username}/follow`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                setIsFollowing(false);
                setProfile(prev => prev ? {
                    ...prev,
                    followersCount: Math.max(0, prev.followersCount - 1)
                } : null);
            }
        } catch (err) {
            console.error('Failed to unfollow user:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatPostDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getRoleBadgeStyles = (role: string) => {
        const normalizedRole = role.toUpperCase();
        if (normalizedRole === 'ADMIN') {
            return 'bg-primary text-primary-foreground';
        }
        if (normalizedRole === 'MODERATOR') {
            return 'bg-blue-600 text-white';
        }
        return 'bg-secondary text-secondary-foreground';
    };

    const getRoleDisplayName = (role: string) => {
        const normalizedRole = role.toUpperCase();
        if (normalizedRole === 'ADMIN') return 'Admin';
        if (normalizedRole === 'MODERATOR') return 'Moderator';
        return 'Member';
    };

    const getInitials = (name?: string, username?: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (username) {
            return username.slice(0, 2).toUpperCase();
        }
        return 'U';
    };

    const skills = profile?.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header user={currentUser ? {
                    name: currentUser.name || 'User',
                    role: currentUser.role || 'Member',
                    avatar: currentUser.avatar,
                    isAdmin: currentUser.role === 'admin',
                    username: currentUser.username,
                } : undefined} />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header user={currentUser ? {
                    name: currentUser.name || 'User',
                    role: currentUser.role || 'Member',
                    avatar: currentUser.avatar,
                    isAdmin: currentUser.role === 'admin',
                    username: currentUser.username,
                } : undefined} />
                <div className="container mx-auto px-4 py-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Forum
                    </button>
                    <div className="text-center py-20">
                        <h2 className="text-xl font-semibold mb-2">{error || 'User not found'}</h2>
                        <p className="text-muted-foreground">The user you're looking for doesn't exist.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
                <Header user={currentUser ? {
                    name: currentUser.name || 'User',
                    role: currentUser.role || 'Member',
                    avatar: currentUser.avatar,
                    isAdmin: currentUser.role === 'admin',
                    username: currentUser.username,
                } : undefined} />

            <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Forum
                    </button>

                    {/* Profile Card */}
                    <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
                        {/* Banner */}
                        <div className="h-24 md:h-32 bg-gradient-to-r from-green-600 to-green-400" />

                        {/* Profile Info */}
                        <div className="px-4 md:px-6 pb-6">
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-14 md:-mt-16 mb-4">
                                <div className="flex items-end gap-4">
                                    <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background">
                                        <AvatarImage src={profile.avatar} />
                                        <AvatarFallback className="bg-teal-600 text-white text-xl md:text-2xl">
                                            {getInitials(profile.displayName, profile.username)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="mb-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h1 className="text-xl md:text-2xl font-bold">{profile.displayName || profile.username}</h1>
                                            {profile.role.toUpperCase() === 'ADMIN' && (
                                                <svg
                                                    className="h-5 w-5 text-amber-500"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                </svg>
                                            )}
                                            <Badge className={getRoleBadgeStyles(profile.role)}>
                                                {profile.role.toUpperCase() === 'ADMIN' && (
                                                    <svg
                                                        className="h-3 w-3 mr-1"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                    </svg>
                                                )}
                                                {getRoleDisplayName(profile.role)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Joined {formatDate(profile.createdAt)}
                                            </span>
                                            {profile.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" />
                                                    {profile.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0">
                                    {isOwnProfile ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate('/settings')}
                                            className="gap-2"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit Profile
                                        </Button>
                                    ) : (
                                        <Button
                                            variant={isFollowing ? "outline" : "default"}
                                            onClick={isFollowing ? handleUnfollow : handleFollow}
                                            disabled={followLoading}
                                            className="gap-2"
                                        >
                                            {followLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isFollowing ? (
                                                <>
                                                    <UserMinus className="h-4 w-4" />
                                                    Unfollow
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="h-4 w-4" />
                                                    Follow
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                                <p className="text-foreground mb-4">{profile.bio}</p>
                            )}

                            {/* Social Links */}
                            {(profile.website || profile.githubUsername || profile.twitterHandle) && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
                                    {profile.website && (
                                        <a
                                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                                        >
                                            <Globe className="h-4 w-4" />
                                            Website
                                        </a>
                                    )}
                                    {profile.githubUsername && (
                                        <a
                                            href={`https://github.com/${profile.githubUsername}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                            {profile.githubUsername}
                                        </a>
                                    )}
                                    {profile.twitterHandle && (
                                        <a
                                            href={`https://twitter.com/${profile.twitterHandle.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                            @{profile.twitterHandle.replace('@', '')}
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Skills */}
                            {skills.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="font-normal">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                        <StatCard
                            icon={<Star className="h-5 w-5 text-amber-500" />}
                            value={posts.reduce((acc, p) => acc + (p.views || 0), 0)}
                            label="Reputation"
                        />
                        <StatCard
                            icon={<FileText className="h-5 w-5 text-primary" />}
                            value={posts.length}
                            label="Posts"
                        />
                        <StatCard
                            icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
                            value={posts.reduce((acc, p) => acc + (p.commentCount || 0), 0)}
                            label="Replies"
                        />
                        <StatCard
                            icon={<Shield className="h-5 w-5 text-green-500" />}
                            value={getRoleDisplayName(profile.role)}
                            label="Role"
                            isText
                        />
                    </div>

                    {/* Tabs */}
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="flex border-b border-border">
                            <TabButton
                                active={activeTab === 'posts'}
                                onClick={() => setActiveTab('posts')}
                                count={posts.length}
                            >
                                Posts
                            </TabButton>
                            <TabButton
                                active={activeTab === 'followers'}
                                onClick={() => setActiveTab('followers')}
                                count={profile.followersCount}
                            >
                                Followers
                            </TabButton>
                            <TabButton
                                active={activeTab === 'following'}
                                onClick={() => setActiveTab('following')}
                                count={profile.followingCount}
                            >
                                Following
                            </TabButton>
                            <TabButton
                                active={activeTab === 'activity'}
                                onClick={() => setActiveTab('activity')}
                            >
                                Activity
                            </TabButton>
                        </div>

                        <div className="p-4">
                            {activeTab === 'posts' && (
                                <div className="space-y-4">
                                    {posts.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">No posts yet</p>
                                    ) : (
                                        posts.map((post) => (
                                            <PostItem
                                                key={post.id}
                                                post={post}
                                                onClick={() => navigate(`/post/${post.id}`)}
                                                formatDate={formatPostDate}
                                            />
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'followers' && (
                                <div className="space-y-3">
                                    {followers.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">No followers yet</p>
                                    ) : (
                                        followers.map((follower) => (
                                            <UserItem
                                                key={follower.id}
                                                user={follower}
                                                onClick={() => navigate(`/profile/${follower.username}`)}
                                            />
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'following' && (
                                <div className="space-y-3">
                                    {following.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">Not following anyone yet</p>
                                    ) : (
                                        following.map((user) => (
                                            <UserItem
                                                key={user.id}
                                                user={user}
                                                onClick={() => navigate(`/profile/${user.username}`)}
                                            />
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <p className="text-muted-foreground text-center py-8">Activity feed coming soon</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, value, label, isText = false }: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    isText?: boolean;
}) {
    return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center">
            {icon}
            <span className={`font-bold mt-2 ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
        </div>
    );
}

function TabButton({ children, active, onClick, count }: {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
    count?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                active
                    ? 'text-foreground border-b-2 border-primary -mb-[1px]'
                    : 'text-muted-foreground hover:text-foreground'
            }`}
        >
            {children}
            {count !== undefined && (
                <span className="ml-1 text-muted-foreground">({count})</span>
            )}
        </button>
    );
}

function PostItem({ post, onClick, formatDate }: {
    post: UserPost;
    onClick: () => void;
    formatDate: (date: string) => string;
}) {
    return (
        <div
            onClick={onClick}
            className="p-4 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/30 transition-colors"
        >
            <h3 className="font-medium text-foreground hover:text-primary transition-colors mb-2">
                {post.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {post.tags.length > 0 && (
                    <Badge variant="secondary" className="font-normal">
                        {post.tags[0].name}
                    </Badge>
                )}
                {post.views !== undefined && (
                    <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.views}
                    </span>
                )}
                {post.commentCount !== undefined && (
                    <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.commentCount}
                    </span>
                )}
                <span>{formatDate(post.createdAt)}</span>
            </div>
        </div>
    );
}

function UserItem({ user, onClick }: {
    user: FollowerUser;
    onClick: () => void;
}) {
    const getInitials = (name?: string, username?: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (username) {
            return username.slice(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <div
            onClick={onClick}
            className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/30 transition-colors"
        >
            <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-teal-600 text-white">
                    {getInitials(user.displayName, user.username)}
                </AvatarFallback>
            </Avatar>
            <div>
                <p className="font-medium text-foreground">{user.displayName || user.username}</p>
                {user.username && (
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
            </div>
        </div>
    );
}

export default UserProfile;
