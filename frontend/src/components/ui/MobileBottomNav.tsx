import { useNavigate, useLocation } from "react-router-dom";
import { Home, FolderTree, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  action?: 'categories' | 'notifications' | 'profile';
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: FolderTree, label: 'Categories', action: 'categories' },
  { icon: Bell, label: 'Notifications', action: 'notifications' },
  { icon: User, label: 'Profile', action: 'profile' },
];

interface MobileBottomNavProps {
  onCategoriesClick?: () => void;
  onNotificationsClick?: () => void;
}

export function MobileBottomNav({ onCategoriesClick, onNotificationsClick }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavClick = (item: NavItem) => {
    if (item.action === 'categories' && onCategoriesClick) {
      onCategoriesClick();
    } else if (item.action === 'notifications' && onNotificationsClick) {
      onNotificationsClick();
    } else if (item.action === 'profile' && user?.username) {
      navigate(`/profile/${user.username}`);
    } else if (item.action === 'profile' && !user) {
      navigate('/login');
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.path ? isActive(item.path) : false;

          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 w-full transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
