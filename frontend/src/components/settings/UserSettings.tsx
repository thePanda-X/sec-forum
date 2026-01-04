import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { Header } from '@/components/forum/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Palette, Shield, Upload, Loader2, ArrowLeft, Save, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';

const API_BASE = '/api/v1';

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security';

interface UserProfile {
    displayName: string;
    username: string;
    avatar: string;
    bio: string;
    location: string;
    website: string;
    githubUsername: string;
    twitterHandle: string;
    skills: string;
}

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    emailForReplies: boolean;
    emailForMentions: boolean;
    weeklyDigest: boolean;
}

interface AppearanceSettings {
    theme: 'light' | 'dark';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
}

export function UserSettings() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [savedMessage, setSavedMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [profile, setProfile] = useState<UserProfile>({
        displayName: '',
        username: '',
        avatar: '',
        bio: '',
        location: '',
        website: '',
        githubUsername: '',
        twitterHandle: '',
        skills: '',
    });

    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: true,
        emailForReplies: true,
        emailForMentions: true,
        weeklyDigest: false,
    });

    const [appearance, setAppearance] = useState<AppearanceSettings>({
        theme: 'dark',
        fontSize: 'medium',
        compactMode: false,
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: User },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        { id: 'appearance' as const, label: 'Appearance', icon: Palette },
        { id: 'security' as const, label: 'Security', icon: Shield },
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_BASE}/settings`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.profile) {
                    setProfile(prev => ({
                        ...prev,
                        displayName: data.profile.displayName || '',
                        username: data.profile.username || '',
                        avatar: data.profile.avatar || '',
                        bio: data.profile.bio || '',
                        location: data.profile.location || '',
                        website: data.profile.website || '',
                        githubUsername: data.profile.githubUsername || '',
                        twitterHandle: data.profile.twitterHandle || '',
                        skills: data.profile.skills || '',
                    }));
                }
                if (data.settings) {
                    setAppearance(prev => ({
                        ...prev,
                        theme: data.settings.theme || 'dark',
                        fontSize: data.settings.fontSize || 'medium',
                        compactMode: data.settings.compactMode || false,
                    }));
                    setNotifications(prev => ({
                        ...prev,
                        emailNotifications: data.settings.emailNotifications ?? true,
                        pushNotifications: data.settings.pushNotifications ?? true,
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const showSavedMessage = (message: string) => {
        setSavedMessage(message);
        setTimeout(() => setSavedMessage(''), 3000);
    };

    const showErrorMessage = (message: string) => {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 5000);
    };

    const handleSaveProfile = async () => {
        try {
            const response = await fetch(`${API_BASE}/settings/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    bio: profile.bio,
                    location: profile.location,
                    website: profile.website,
                    githubUsername: profile.githubUsername,
                    twitterHandle: profile.twitterHandle,
                    skills: profile.skills,
                }),
            });

            if (response.ok) {
                showSavedMessage('Profile settings saved!');
            } else {
                const error = await response.json();
                showErrorMessage(error.error || 'Failed to save profile');
            }
        } catch (error) {
            showErrorMessage('Failed to save profile');
        }
    };

    const handleSaveAppearance = async () => {
        try {
            const response = await fetch(`${API_BASE}/settings/appearance`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    theme: appearance.theme,
                    fontSize: appearance.fontSize,
                    compactMode: appearance.compactMode,
                }),
            });

            if (response.ok) {
                setTheme(appearance.theme);
                showSavedMessage('Appearance settings saved!');
            } else {
                const error = await response.json();
                showErrorMessage(error.error || 'Failed to save appearance settings');
            }
        } catch (error) {
            showErrorMessage('Failed to save appearance settings');
        }
    };

    const handleSaveNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    emailNotifications: notifications.emailNotifications,
                    pushNotifications: notifications.pushNotifications,
                }),
            });

            if (response.ok) {
                showSavedMessage('Notification settings saved!');
            } else {
                const error = await response.json();
                showErrorMessage(error.error || 'Failed to save notification settings');
            }
        } catch (error) {
            showErrorMessage('Failed to save notification settings');
        }
    };

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            showErrorMessage('New passwords do not match');
            return;
        }

        if (passwords.new.length < 8) {
            showErrorMessage('Password must be at least 8 characters');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/settings/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new,
                }),
            });

            if (response.ok) {
                showSavedMessage('Password changed successfully!');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                const error = await response.json();
                showErrorMessage(error.error || 'Failed to change password');
            }
        } catch (error) {
            showErrorMessage('Failed to change password');
        }
    };

    const handleDeleteAccount = async () => {
        const password = prompt('Please enter your password to confirm account deletion:');
        if (!password) return;

        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/settings/account`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                navigate('/');
            } else {
                const error = await response.json();
                showErrorMessage(error.error || 'Failed to delete account');
            }
        } catch (error) {
            showErrorMessage('Failed to delete account');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`${API_BASE}/settings/avatar`, {
                method: 'PUT',
                credentials: 'include',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(prev => ({ ...prev, avatar: data.avatar }));
                showSavedMessage('Avatar uploaded successfully!');
            } else {
                showErrorMessage('Failed to upload avatar');
            }
        } catch (error) {
            showErrorMessage('Failed to upload avatar');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header user={user ? {
                name: user.name || 'User',
                role: user.role || 'Member',
                avatar: user.avatar,
                isAdmin: user.role === 'admin',
                username: user.username,
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
                    <h1 className="text-2xl font-bold mb-8 text-center">Settings</h1>

                    {(savedMessage || errorMessage) && (
                        <div className={`mb-4 text-sm ${errorMessage ? 'text-red-500' : 'text-green-500'}`}>
                            {savedMessage || errorMessage}
                        </div>
                    )}

                    <div className="mb-8">
                        <div className="hidden md:flex max-w-2xl mx-auto bg-card p-1 rounded-lg border">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="md:hidden">
                            <Select value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select tab" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <SelectItem key={tab.id} value={tab.id}>
                                                <div className="flex items-center space-x-2">
                                                    <Icon className="h-4 w-4" />
                                                    <span>{tab.label}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="max-w-2xl mx-auto">
                            {activeTab === 'profile' && (
                                <ProfileTab
                                    profile={profile}
                                    setProfile={setProfile}
                                    onSave={handleSaveProfile}
                                    onFileUpload={handleFileUpload}
                                />
                            )}

                            {activeTab === 'notifications' && (
                                <NotificationsTab
                                    notifications={notifications}
                                    setNotifications={setNotifications}
                                    onSave={handleSaveNotifications}
                                />
                            )}

                            {activeTab === 'appearance' && (
                                <AppearanceTab
                                    appearance={appearance}
                                    setAppearance={setAppearance}
                                    theme={theme}
                                    setTheme={setTheme}
                                    onSave={handleSaveAppearance}
                                />
                            )}

                            {activeTab === 'security' && (
                                <SecurityTab
                                    passwords={passwords}
                                    setPasswords={setPasswords}
                                    onSave={handleChangePassword}
                                    onDelete={handleDeleteAccount}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileTab({ profile, setProfile, onSave, onFileUpload }: {
    profile: UserProfile;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    onSave: () => void;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    const initials = profile.displayName
        ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : profile.username?.slice(0, 2).toUpperCase() || 'U';

    return (
        <>
            <div className="bg-card mb-2 rounded-lg p-4 md:p-6 border">
                <h2 className="text-lg font-semibold mb-2">Profile Picture</h2>
                <p className="text-muted-foreground text-sm mb-4">Update your profile photo</p>

                <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onFileUpload}
                            className="hidden"
                            id="profile-upload"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('profile-upload')?.click()}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Change Photo
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg p-4 md:p-6 border">
                <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
                <p className="text-muted-foreground text-sm mb-4">Update your public profile details</p>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={profile.displayName}
                            onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={profile.bio}
                            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                            rows={4}
                            className="mt-1"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={profile.location}
                                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                value={profile.website}
                                onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="github">GitHub Username</Label>
                            <Input
                                id="github"
                                value={profile.githubUsername}
                                onChange={(e) => setProfile(prev => ({ ...prev, githubUsername: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="twitter">Twitter Handle</Label>
                            <Input
                                id="twitter"
                                value={profile.twitterHandle}
                                onChange={(e) => setProfile(prev => ({ ...prev, twitterHandle: e.target.value }))}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="skills">Skills (comma separated)</Label>
                        <Input
                            id="skills"
                            value={profile.skills}
                            onChange={(e) => setProfile(prev => ({ ...prev, skills: e.target.value }))}
                            className="mt-1"
                        />
                    </div>

                    <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                    </Button>
                </div>
            </div>
        </>
    );
}

function NotificationsTab({ notifications, setNotifications, onSave }: {
    notifications: NotificationSettings;
    setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
    onSave: () => void;
}) {
    return (
        <div className="bg-card rounded-lg p-4 md:p-6 border">
            < h2 className="text-lg font-semibold mb-2" > Notification Preferences</h2 >
            <p className="text-muted-foreground text-sm mb-6">Control how you receive notifications</p>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive email notifications</p>
                    </div>
                    <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) => {
                            setNotifications(prev => ({ ...prev, emailNotifications: checked }));
                            onSave();
                        }}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Push Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                    <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => {
                            setNotifications(prev => ({ ...prev, pushNotifications: checked }));
                            onSave();
                        }}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Email for Replies</h3>
                        <p className="text-sm text-muted-foreground">Get notified when someone replies to your posts</p>
                    </div>
                    <Switch
                        checked={notifications.emailForReplies}
                        onCheckedChange={(checked) => {
                            setNotifications(prev => ({ ...prev, emailForReplies: checked }));
                            onSave();
                        }}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Email for Mentions</h3>
                        <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
                    </div>
                    <Switch
                        checked={notifications.emailForMentions}
                        onCheckedChange={(checked) => {
                            setNotifications(prev => ({ ...prev, emailForMentions: checked }));
                            onSave();
                        }}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Weekly Digest</h3>
                        <p className="text-sm text-muted-foreground">Receive a weekly summary of activity</p>
                    </div>
                    <Switch
                        checked={notifications.weeklyDigest}
                        onCheckedChange={(checked) => {
                            setNotifications(prev => ({ ...prev, weeklyDigest: checked }));
                            onSave();
                        }}
                    />
                </div>
            </div>
        </div >
    );
}

function AppearanceTab({ appearance, setAppearance, theme, setTheme, onSave }: {
    appearance: AppearanceSettings;
    setAppearance: React.Dispatch<React.SetStateAction<AppearanceSettings>>;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    onSave: () => void;
}) {
    return (
        <div className="bg-card rounded-lg p-4 md:p-6 border">
            <h2 className="text-lg font-semibold mb-2">Appearance Settings</h2>
            <p className="text-muted-foreground text-sm mb-6">Customize how the forum looks</p>

            <div className="space-y-6">
                <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                        value={theme}
                        onValueChange={(value: 'light' | 'dark') => {
                            setTheme(value);
                            setAppearance(prev => ({ ...prev, theme: value }));
                        }}
                    >
                        <SelectTrigger className="w-full md:w-48 mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select
                        value={appearance.fontSize}
                        onValueChange={(value: 'small' | 'medium' | 'large') => {
                            setAppearance(prev => ({ ...prev, fontSize: value }));
                            onSave();
                        }}
                    >
                        <SelectTrigger className="w-full md:w-48 mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Compact Mode</h3>
                        <p className="text-sm text-muted-foreground">Show more content with less spacing</p>
                    </div>
                    <Switch
                        checked={appearance.compactMode}
                        onCheckedChange={(checked) => {
                            setAppearance(prev => ({ ...prev, compactMode: checked }));
                            onSave();
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function SecurityTab({ passwords, setPasswords, onSave, onDelete }: {
    passwords: { current: string; new: string; confirm: string };
    setPasswords: React.Dispatch<React.SetStateAction<{ current: string; new: string; confirm: string }>>;
    onSave: () => void;
    onDelete: () => void;
}) {
    return (
        <>
            <div className="bg-card mb-2 rounded-lg p-4 md:p-6 border">
                <h2 className="text-lg font-semibold mb-2">Change Password</h2>
                <p className="text-muted-foreground text-sm mb-4">Update your account password</p>

                <div className="space-y-4 max-w-full md:max-w-md">
                    <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                            className="mt-1"
                        />
                    </div>

                    <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">
                        <Shield className="h-4 w-4 mr-2" />
                        Update Password
                    </Button>
                </div>
            </div>

            <div className="bg-card border-destructive rounded-lg p-4 md:p-6 border">
                <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h2 className="font-semibold text-destructive flex items-center gap-2 text-base sm:text-lg">Danger Zone</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-4">Irreversible actions</p>

                <Button
                    variant="destructive"
                    onClick={onDelete}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                </Button>
            </div>
        </>
    );
}
