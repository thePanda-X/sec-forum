import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  MessageSquare,
  AtSign,
  Heart,
  Award,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const API_BASE = "/api/v1";

interface Notification {
  id: string;
  type: "reply" | "mention" | "like" | "achievement" | "comment" | "follow" | "post_pinned";
  title: string;
  description: string;
  message?: string;
  time: string;
  createdAt?: string;
  read: boolean;
  isRead?: boolean;
  postId?: number;
  actorUserId?: number;
  user?: {
    name: string;
    username?: string;
    avatar?: string;
  };
  actor?: {
    name: string;
    username?: string;
    avatar?: string;
  };
  post?: {
    id: number;
    title?: string;
  };
}

const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  switch (type) {
    case "reply":
    case "comment":
      return <MessageSquare className="h-4 w-4 text-blue-400" />;
    case "mention":
      return <AtSign className="h-4 w-4 text-green-400" />;
    case "like":
      return <Heart className="h-4 w-4 text-red-400" />;
    case "achievement":
      return <Award className="h-4 w-4 text-yellow-400" />;
    default:
      return <MessageSquare className="h-4 w-4 text-blue-400" />;
  }
};

function getNotificationActionText(type: string, description: string): string {
  const postRelatedTypes = ["like", "comment", "mention", "post_pinned"];
  
  if (postRelatedTypes.includes(type)) {
    const match = description.match(/^(.+) (.+)$/);
    if (match && match[2]) {
      return match[2];
    }
    return description;
  }

  if (type === "follow") {
    const match = description.match(/^(?:.+) (started following you)$/);
    if (match) {
      return "started following you";
    }
  }

  if (type === "reply") {
    const match = description.match(/^(?:.+) (replied to your comment)$/);
    if (match) {
      return "replied to your comment";
    }
  }

  if (type === "achievement") {
    return description;
  }

  return description;
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return `${Math.floor(diffInDays / 7)}w ago`;
}

export function NotificationsDropdown() {
  const { t } = useTranslation('notifications');
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      const notificationList = Array.isArray(data)
        ? data
        : data.notifications || [];

      // Map API response to our format
      const mapped: Notification[] = notificationList.map((n: any) => ({
        id: n.id,
        type: n.type || "reply",
        title: n.title || getDefaultTitle(n.type),
        description: n.body || n.description || n.message || "",
        time: n.time || formatRelativeTime(n.createdAt),
        read: n.read ?? n.isRead ?? false,
        postId: n.postId,
        actorUserId: n.actorUserId,
        actor: n.actor?.profile ? {
          name: n.actor.profile.displayName,
          username: n.actor.profile.username,
          avatar: n.actor.profile.avatar,
        } : undefined,
        post: n.post ? {
          id: n.post.id,
          title: n.post.title,
        } : undefined,
      }));

      setNotifications(mapped);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load notifications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success(t('toast.markedAsRead'));
      } else {
        toast.error(t('toast.markReadFailed'));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error(t('toast.markReadFailed'));
    }
  };

  const handleClearAll = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/clear`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications([]);
        toast.success(t('toast.cleared'));
      } else {
        toast.error(t('toast.clearFailed'));
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      toast.error(t('toast.clearFailed'));
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkRead(notification.id);
    }

    switch (notification.type) {
      case "reply":
      case "comment":
      case "mention":
      case "like":
      case "post_pinned":
        if (notification.postId) {
          navigate(`/post/${notification.postId}`);
        }
        break;
      case "follow":
        if (notification.actor?.username) {
          navigate(`/profile/${notification.actor.username}`);
        }
        break;
      case "achievement":
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">{t('title')}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handleMarkAllRead}
            disabled={notifications.every((n) => n.read)}
          >
            <Check className="h-3 w-3" />
            {t('markAllRead')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-80">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">{t('noNotifications')}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="group flex items-start gap-3 p-4 hover:bg-secondary/50 cursor-pointer border-b border-border last:border-b-0"
                onClick={() => handleNotificationClick(notification)}
              >
                {/* User Avatar or Icon */}
                {notification.actor ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.actor.avatar} />
                    <AvatarFallback className="bg-teal-600 text-white text-sm">
                      {(notification.actor.name || notification.actor.username || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary">
                    <NotificationIcon type={notification.type} />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <NotificationIcon type={notification.type} />
                    <span className="text-sm text-muted-foreground">
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">
                    {notification.type === "post_pinned" ? (
                      notification.description
                    ) : (
                      <>
                        {notification.actor ? (
                          <span
                            className="font-semibold text-foreground hover:text-primary underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notification.actor?.username) {
                                navigate(`/profile/${notification.actor.username}`);
                              }
                            }}
                          >
                            {notification.actor.name}
                          </span>
                        ) : null}{" "}
                        {getNotificationActionText(notification.type, notification.description)}
                      </>
                    )}
                  </p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {notification.time}
                  </span>
                </div>

                {/* Mark as read button - visible on hover */}
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(notification.id);
                    }}
                    title={t('markAsRead')}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function getDefaultTitle(type: string): string {
  switch (type) {
    case "reply":
    case "comment":
      return "New Reply";
    case "mention":
      return "You were mentioned";
    case "like":
      return "Post Liked";
    case "achievement":
      return "Achievement Unlocked";
    case "follow":
      return "New Follower";
    default:
      return "Notification";
  }
}
