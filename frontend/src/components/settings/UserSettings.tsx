import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type SupportedLanguage } from '@/i18n';
import { Header } from '@/components/forum/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { User, Bell, Palette, Shield, Upload, Loader2, ArrowLeft, Save, ChevronDown, Trash2, AlertTriangle, Globe } from 'lucide-react';

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
    const { t } = useTranslation('settings');
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
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

    // Image crop modal state
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

    const { uploadImage, isUploading: isUploadingAvatar } = useImageUpload();

    const tabs = [
        { id: 'profile' as const, label: t('tabs.profile'), icon: User },
        { id: 'notifications' as const, label: t('tabs.notifications'), icon: Bell },
        { id: 'appearance' as const, label: t('tabs.appearance'), icon: Palette },
        { id: 'security' as const, label: t('tabs.security'), icon: Shield },
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (location.pathname === '/settings') {
            setActiveTab('profile');
        }
    }, [location.key]);

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
                toast.success(t('toast.profileUpdated'), {
                    description: t('toast.profileUpdatedDesc'),
                });
            } else {
                const error = await response.json();
                toast.error(t('toast.profileFailed'), {
                    description: error.error || t('toast.profileFailedDesc'),
                });
            }
        } catch (error) {
            toast.error(t('toast.profileFailed'), {
                description: t('toast.profileFailedDesc'),
            });
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
                toast.success(t('toast.appearanceUpdated'), {
                    description: t('toast.appearanceUpdatedDesc'),
                });
            } else {
                const error = await response.json();
                toast.error(t('toast.appearanceFailed'), {
                    description: error.error || t('toast.appearanceFailedDesc'),
                });
            }
        } catch (error) {
            toast.error(t('toast.appearanceFailed'), {
                description: t('toast.appearanceFailedDesc'),
            });
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
                toast.success(t('toast.notificationsUpdated'), {
                    description: t('toast.notificationsUpdatedDesc'),
                });
            } else {
                const error = await response.json();
                toast.error(t('toast.notificationsFailed'), {
                    description: error.error || t('toast.notificationsFailedDesc'),
                });
            }
        } catch (error) {
            toast.error(t('toast.notificationsFailed'), {
                description: t('toast.notificationsFailedDesc'),
            });
        }
    };

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            toast.error(t('validation.passwordMismatch'), {
                description: t('validation.passwordMismatchDesc'),
            });
            return;
        }

        if (passwords.new.length < 8) {
            toast.error(t('validation.passwordTooShort'), {
                description: t('validation.passwordTooShortDesc'),
            });
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
                toast.success(t('toast.passwordChanged'), {
                    description: t('toast.passwordChangedDesc'),
                });
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                const error = await response.json();
                toast.error(t('toast.passwordFailed'), {
                    description: error.error || t('toast.passwordFailedDesc'),
                });
            }
        } catch (error) {
            toast.error(t('toast.passwordFailed'), {
                description: t('toast.passwordFailedDesc'),
            });
        }
    };

    const handleDeleteAccount = async () => {
        const password = prompt(t('security.dangerZone.passwordPrompt'));
        if (!password) return;

        if (!confirm(t('security.dangerZone.deleteConfirmation'))) {
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
                toast.success(t('toast.accountDeleted'), {
                    description: t('toast.accountDeletedDesc'),
                });
                navigate('/');
            } else {
                const error = await response.json();
                toast.error(t('toast.accountDeleteFailed'), {
                    description: error.error || t('toast.accountDeleteFailedDesc'),
                });
            }
        } catch (error) {
            toast.error(t('toast.accountDeleteFailed'), {
                description: t('toast.accountDeleteFailedDesc'),
            });
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Create a URL for the selected image and open crop modal
        const imageUrl = URL.createObjectURL(file);
        setSelectedImageSrc(imageUrl);
        setCropModalOpen(true);
        
        // Reset the input so the same file can be selected again
        event.target.value = '';
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        // Clean up the object URL
        if (selectedImageSrc) {
            URL.revokeObjectURL(selectedImageSrc);
            setSelectedImageSrc(null);
        }

        try {
            // Create a File from the Blob for upload
            const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
            
            // Upload to S3/MinIO through backend proxy
            const publicUrl = await uploadImage(croppedFile, 'avatars');
            
            // Update avatar URL in backend
            const response = await fetch(`${API_BASE}/settings/avatar`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ avatar: publicUrl }),
            });

            if (response.ok) {
                setProfile(prev => ({ ...prev, avatar: publicUrl }));
                toast.success(t('toast.avatarUpdated'), {
                    description: t('toast.avatarUpdatedDesc'),
                });
            } else {
                toast.error(t('toast.avatarFailed'), {
                    description: t('toast.avatarFailedDesc'),
                });
            }
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            toast.error(t('toast.avatarFailed'), {
                description: error instanceof Error ? error.message : t('toast.avatarFailedDesc'),
            });
        }
    };

    const handleCropModalClose = () => {
        setCropModalOpen(false);
        if (selectedImageSrc) {
            URL.revokeObjectURL(selectedImageSrc);
            setSelectedImageSrc(null);
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
                isModerator: user.role === 'moderator',
                username: user.username,
            } : undefined} />

            <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('common:navigation.backToForum')}
                    </button>
                    <h1 className="text-2xl font-bold mb-8 text-center">{t('title')}</h1>

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
                                    isUploading={isUploadingAvatar}
                                    t={t}
                                />
                            )}

                            {activeTab === 'notifications' && (
                                <NotificationsTab
                                    notifications={notifications}
                                    setNotifications={setNotifications}
                                    onSave={handleSaveNotifications}
                                    t={t}
                                />
                            )}

                            {activeTab === 'appearance' && (
                                <AppearanceTab
                                    appearance={appearance}
                                    setAppearance={setAppearance}
                                    theme={theme}
                                    setTheme={setTheme}
                                    onSave={handleSaveAppearance}
                                    language={language}
                                    setLanguage={setLanguage}
                                    t={t}
                                />
                            )}

                            {activeTab === 'security' && (
                                <SecurityTab
                                    passwords={passwords}
                                    setPasswords={setPasswords}
                                    onSave={handleChangePassword}
                                    onDelete={handleDeleteAccount}
                                    t={t}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Crop Modal */}
            {selectedImageSrc && (
                <ImageCropModal
                    isOpen={cropModalOpen}
                    onClose={handleCropModalClose}
                    imageSrc={selectedImageSrc}
                    onCropComplete={handleCropComplete}
                    aspectRatio={1}
                    circularCrop={true}
                    title={t('profile.picture.cropTitle') || 'Crop Profile Picture'}
                />
            )}
        </div>
    );
}

function ProfileTab({ profile, setProfile, onSave, onFileUpload, isUploading, t }: {
    profile: UserProfile;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    onSave: () => void;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    t: (key: string) => string;
}) {
    const initials = profile.displayName
        ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : profile.username?.slice(0, 2).toUpperCase() || 'U';

    return (
        <>
            <div className="bg-card mb-2 rounded-lg p-4 md:p-6 border">
                <h2 className="text-lg font-semibold mb-2">{t('profile.picture.title')}</h2>
                <p className="text-muted-foreground text-sm mb-4">{t('profile.picture.subtitle')}</p>

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
                            disabled={isUploading}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('profile-upload')?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('profile.picture.uploading') || 'Uploading...'}
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {t('profile.picture.change')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg p-4 md:p-6 border">
                <h2 className="text-lg font-semibold mb-2">{t('profile.title')}</h2>
                <p className="text-muted-foreground text-sm mb-4">{t('profile.subtitle')}</p>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="displayName">{t('profile.displayName')}</Label>
                        <Input
                            id="displayName"
                            value={profile.displayName}
                            onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="bio">{t('profile.bio')}</Label>
                        <Textarea
                            id="bio"
                            value={profile.bio}
                            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                            rows={4}
                            className="mt-1"
                            placeholder={t('profile.bioPlaceholder')}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="location">{t('profile.location')}</Label>
                            <Input
                                id="location"
                                value={profile.location}
                                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                                className="mt-1"
                                placeholder={t('profile.locationPlaceholder')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="website">{t('profile.website')}</Label>
                            <Input
                                id="website"
                                value={profile.website}
                                onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                                className="mt-1"
                                placeholder={t('profile.websitePlaceholder')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="github">{t('profile.github')}</Label>
                            <Input
                                id="github"
                                value={profile.githubUsername}
                                onChange={(e) => setProfile(prev => ({ ...prev, githubUsername: e.target.value }))}
                                className="mt-1"
                                placeholder={t('profile.githubPlaceholder')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="twitter">{t('profile.twitter')}</Label>
                            <Input
                                id="twitter"
                                value={profile.twitterHandle}
                                onChange={(e) => setProfile(prev => ({ ...prev, twitterHandle: e.target.value }))}
                                className="mt-1"
                                placeholder={t('profile.twitterPlaceholder')}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="skills">{t('profile.skills')}</Label>
                        <Input
                            id="skills"
                            value={profile.skills}
                            onChange={(e) => setProfile(prev => ({ ...prev, skills: e.target.value }))}
                            className="mt-1"
                            placeholder={t('profile.skillsPlaceholder')}
                        />
                    </div>

                    <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="h-4 w-4 mr-2" />
                        {t('profile.save')}
                    </Button>
                </div>
            </div>
        </>
    );
}

function NotificationsTab({ notifications, setNotifications, onSave, t }: {
    notifications: NotificationSettings;
    setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
    onSave: () => void;
    t: (key: string) => string;
}) {
    return (
        <div className="bg-card rounded-lg p-4 md:p-6 border">
            <h2 className="text-lg font-semibold mb-2">{t('notifications.title')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('notifications.subtitle')}</p>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">{t('notifications.email.title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('notifications.email.description')}</p>
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
                        <h3 className="font-medium">{t('notifications.push.title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('notifications.push.description')}</p>
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
                        <h3 className="font-medium">{t('notifications.replies.title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('notifications.replies.description')}</p>
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
                        <h3 className="font-medium">{t('notifications.mentions.title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('notifications.mentions.description')}</p>
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
                        <h3 className="font-medium">{t('notifications.digest.title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('notifications.digest.description')}</p>
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
        </div>
    );
}

function AppearanceTab({ appearance, setAppearance, theme, setTheme, onSave, language, setLanguage, t }: {
    appearance: AppearanceSettings;
    setAppearance: React.Dispatch<React.SetStateAction<AppearanceSettings>>;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    onSave: () => void;
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => Promise<void>;
    t: (key: string) => string;
}) {
    return (
        <div className="bg-card rounded-lg p-4 md:p-6 border">
            <h2 className="text-lg font-semibold mb-2">{t('appearance.title')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('appearance.subtitle')}</p>

            <div className="space-y-6">
                <div>
                    <Label htmlFor="language" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {t('appearance.language.title')}
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">{t('appearance.language.description')}</p>
                    <Select
                        value={language}
                        onValueChange={(value: SupportedLanguage) => setLanguage(value)}
                    >
                        <SelectTrigger className="w-full md:w-48 mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                    {LANGUAGE_NAMES[lang]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                <div>
                    <Label htmlFor="theme">{t('appearance.theme.title')}</Label>
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
                            <SelectItem value="light">{t('appearance.theme.light')}</SelectItem>
                            <SelectItem value="dark">{t('appearance.theme.dark')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="fontSize">{t('appearance.fontSize.title')}</Label>
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
                            <SelectItem value="small">{t('appearance.fontSize.small')}</SelectItem>
                            <SelectItem value="medium">{t('appearance.fontSize.medium')}</SelectItem>
                            <SelectItem value="large">{t('appearance.fontSize.large')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">{t('appearance.compactMode.title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('appearance.compactMode.description')}</p>
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

function SecurityTab({ passwords, setPasswords, onSave, onDelete, t }: {
    passwords: { current: string; new: string; confirm: string };
    setPasswords: React.Dispatch<React.SetStateAction<{ current: string; new: string; confirm: string }>>;
    onSave: () => void;
    onDelete: () => void;
    t: (key: string) => string;
}) {
    return (
        <>
            <div className="bg-card mb-2 rounded-lg p-4 md:p-6 border">
                <h2 className="text-lg font-semibold mb-2">{t('security.changePassword.title')}</h2>
                <p className="text-muted-foreground text-sm mb-4">{t('security.changePassword.subtitle')}</p>

                <div className="space-y-4 max-w-full md:max-w-md">
                    <div>
                        <Label htmlFor="currentPassword">{t('security.changePassword.current')}</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                            className="mt-1"
                            placeholder={t('security.changePassword.currentPlaceholder')}
                        />
                    </div>

                    <div>
                        <Label htmlFor="newPassword">{t('security.changePassword.new')}</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                            className="mt-1"
                            placeholder={t('security.changePassword.newPlaceholder')}
                        />
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">{t('security.changePassword.confirm')}</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                            className="mt-1"
                            placeholder={t('security.changePassword.confirmPlaceholder')}
                        />
                    </div>

                    <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">
                        <Shield className="h-4 w-4 mr-2" />
                        {t('security.changePassword.update')}
                    </Button>
                </div>
            </div>

            <div className="bg-card border-destructive rounded-lg p-4 md:p-6 border">
                <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h2 className="font-semibold text-destructive flex items-center gap-2 text-base sm:text-lg">{t('security.dangerZone.title')}</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{t('security.dangerZone.subtitle')}</p>

                <Button
                    variant="destructive"
                    onClick={onDelete}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('security.dangerZone.deleteAccount')}
                </Button>
            </div>
        </>
    );
}
