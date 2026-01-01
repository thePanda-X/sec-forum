import { MessageSquare, AtSign, Heart, Award, Check, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: "reply" | "mention" | "like" | "achievement";
  title: string;
  description: string;
  time: string;
  read: boolean;
  user?: {
    name: string;
    avatar?: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "reply",
    title: "New Reply",
    description: "CryptoKnight replied to your post about zero-day vulnerabilities",
    time: "8m ago",
    read: false,
    user: {
      name: "CryptoKnight",
    },
  },
  {
    id: "2",
    type: "mention",
    title: "You were mentioned",
    description: "NetGuardian mentioned you in 'Best practices for API security'",
    time: "33m ago",
    read: false,
    user: {
      name: "NetGuardian",
    },
  },
  {
    id: "3",
    type: "like",
    title: "Post Liked",
    description: "MalwareHunter liked your post on ransomware analysis",
    time: "2h ago",
    read: false,
    user: {
      name: "MalwareHunter",
    },
  },
  {
    id: "4",
    type: "achievement",
    title: "Achievement Unlocked",
    description: "You earned the 'First 100 Reputation' badge!",
    time: "1d ago",
    read: true,
  },
];

const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  switch (type) {
    case "reply":
      return <MessageSquare className="h-4 w-4 text-blue-400" />;
    case "mention":
      return <AtSign className="h-4 w-4 text-green-400" />;
    case "like":
      return <Heart className="h-4 w-4 text-red-400" />;
    case "achievement":
      return <Award className="h-4 w-4 text-yellow-400" />;
  }
};

export function NotificationsDropdown() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
            <Check className="h-3 w-3" />
            Mark all read
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-80">
        <div className="flex flex-col">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-3 p-4 hover:bg-secondary/50 cursor-pointer border-b border-border last:border-b-0"
            >
              {/* User Avatar or Icon */}
              {notification.user ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={notification.user.avatar} />
                  <AvatarFallback className="bg-teal-600 text-white text-sm">
                    {notification.user.name.charAt(0)}
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
                  {notification.description}
                </p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {notification.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
