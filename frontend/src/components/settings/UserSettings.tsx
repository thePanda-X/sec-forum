import React, { useState } from 'react';
import { ArrowLeft, User, Bell, Palette, Shield, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security';

interface UserProfile {
  bio: string;
  location: string;
  website: string;
  githubUsername: string;
  twitterHandle: string;
  skills: string;
}

interface NotificationSettings {
  emailForReplies: boolean;
  emailForMentions: boolean;
  weeklyDigest: boolean;
  pushNotifications: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export function UserSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [savedMessage, setSavedMessage] = useState('');

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    bio: 'Forum administrator and senior security researcher. 10+ years of experience in offensive security and malware analysis.',
    location: 'Austin, TX',
    website: 'https://secureforum.dev',
    githubUsername: 'secureforum-admin',
    twitterHandle: 'secureforum',
    skills: 'Penetration Testing, Malware Analysis, Reverse Engineering, Red Team, Cloud Security'
  });

  // Notification state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailForReplies: true,
    emailForMentions: true,
    weeklyDigest: false,
    pushNotifications: true
  });

  // Appearance state
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'dark',
    fontSize: 'medium',
    compactMode: false
  });

  // Security state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  const handleSave = (section: string) => {
    setSavedMessage(`${section} settings saved!`);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log('Uploading file:', file.name);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Forum
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="search" 
                  placeholder="Search discussions..." 
                  className="w-64 px-3 py-2 bg-muted rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/api/placeholder/32/32" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Settings</h1>
          
          {savedMessage && (
            <div className="mb-4 text-green-500 text-sm">
              {savedMessage}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
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

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'profile' && (
              <ProfileTab 
                profile={profile} 
                setProfile={setProfile} 
                onSave={() => handleSave('Profile')}
                onFileUpload={handleFileUpload}
              />
            )}
            
            {activeTab === 'notifications' && (
              <NotificationsTab 
                notifications={notifications} 
                setNotifications={setNotifications} 
                onSave={() => handleSave('Notification')}
              />
            )}
            
            {activeTab === 'appearance' && (
              <AppearanceTab 
                appearance={appearance} 
                setAppearance={setAppearance} 
                onSave={() => handleSave('Appearance')}
              />
            )}
            
            {activeTab === 'security' && (
              <SecurityTab 
                passwords={passwords} 
                setPasswords={setPasswords} 
                onSave={() => handleSave('Security')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ profile, setProfile, onSave, onFileUpload }: {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSave: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      {/* Profile Picture Section */}
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Profile Picture</h2>
        <p className="text-muted-foreground text-sm mb-4">Update your profile photo</p>
        
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/api/placeholder/64/64" />
            <AvatarFallback>AD</AvatarFallback>
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

      {/* Profile Information Section */}
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
        <p className="text-muted-foreground text-sm mb-4">Update your public profile details</p>
        
        <div className="space-y-4">
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
          
          <div className="grid grid-cols-2 gap-4">
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
          
          <div className="grid grid-cols-2 gap-4">
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
          
          <Button onClick={onSave} className="bg-green-600 hover:bg-green-700">
            Save Profile
          </Button>
        </div>
      </div>
    </>
  );
}

// Notifications Tab Component
function NotificationsTab({ notifications, setNotifications, onSave }: {
  notifications: NotificationSettings;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  onSave: () => void;
}) {
  return (
    <div className="bg-card rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-2">Notification Preferences</h2>
      <p className="text-muted-foreground text-sm mb-6">Control how you receive notifications</p>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Email for Replies</h3>
            <p className="text-sm text-muted-foreground">Get notified when someone replies to your posts</p>
          </div>
          <Switch
            checked={notifications.emailForReplies}
            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailForReplies: checked }))}
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
            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailForMentions: checked }))}
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
            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyDigest: checked }))}
          />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">Enable browser push notifications</p>
          </div>
          <Switch
            checked={notifications.pushNotifications}
            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
          />
        </div>
      </div>
    </div>
  );
}

// Appearance Tab Component
function AppearanceTab({ appearance, setAppearance, onSave }: {
  appearance: AppearanceSettings;
  setAppearance: React.Dispatch<React.SetStateAction<AppearanceSettings>>;
  onSave: () => void;
}) {
  return (
    <div className="bg-card rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-2">Appearance Settings</h2>
      <p className="text-muted-foreground text-sm mb-6">Customize how the forum looks</p>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={appearance.theme}
            onValueChange={(value: 'light' | 'dark') => setAppearance(prev => ({ ...prev, theme: value }))}
          >
            <SelectTrigger className="w-48 mt-1">
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
            onValueChange={(value: 'small' | 'medium' | 'large') => setAppearance(prev => ({ ...prev, fontSize: value }))}
          >
            <SelectTrigger className="w-48 mt-1">
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
            onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, compactMode: checked }))}
          />
        </div>
      </div>
    </div>
  );
}

// Security Tab Component
function SecurityTab({ passwords, setPasswords, onSave }: {
  passwords: { current: string; new: string; confirm: string };
  setPasswords: React.Dispatch<React.SetStateAction<{ current: string; new: string; confirm: string }>>;
  onSave: () => void;
}) {
  const handlePasswordUpdate = () => {
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match');
      return;
    }
    onSave();
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Handle account deletion
      console.log('Deleting account...');
    }
  };

  return (
    <>
      {/* Change Password Section */}
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Change Password</h2>
        <p className="text-muted-foreground text-sm mb-4">Update your account password</p>
        
        <div className="space-y-4 max-w-md">
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
          
          <Button onClick={handlePasswordUpdate} className="bg-green-600 hover:bg-green-700">
            Update Password
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border-destructive rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-4">Irreversible actions</p>
        
        <Button 
          variant="destructive" 
          onClick={handleDeleteAccount}
          className="bg-destructive hover:bg-destructive/90"
        >
          Delete Account
        </Button>
      </div>
    </>
  );
}