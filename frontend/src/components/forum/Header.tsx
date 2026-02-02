import { useState, useEffect } from "react";
import { Search, Bell, User, Settings, Shield, LogOut, LogIn, UserPlus, X, Menu } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { LoginModal } from "@/components/auth/LoginModal";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { SideSheet } from "@/components/ui/SideSheet";
import { ForumStatsSidebar } from "./ForumStatsSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const API_BASE = "/api/v1";

interface HeaderProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
    isAdmin?: boolean;
    isModerator?: boolean;
    username?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(['forum', 'auth', 'common']);
  const [notificationCount, setNotificationCount] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [sideSheetOpen, setSideSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const shouldShowSearch = location.pathname === "/" || location.pathname === "";

  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (shouldShowSearch && currentSearch !== searchQuery) {
      setSearchQuery(currentSearch);
    }
  }, [searchParams, shouldShowSearch]);

  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (debouncedSearchQuery !== currentSearch && shouldShowSearch) {
      navigate(`/?search=${encodeURIComponent(debouncedSearchQuery)}`, { replace: true });
    }
  }, [debouncedSearchQuery, navigate, shouldShowSearch, searchParams]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/unread-count`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count ?? data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePopoverChange = (open: boolean) => {
    setPopoverOpen(open);
    if (!open) {
      setTimeout(fetchUnreadCount, 500);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 p-1 hover:bg-secondary rounded-md transition-colors cursor-pointer"
          aria-label="Go to main forum"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-primary-foreground"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-xl font-semibold hidden sm:inline">SecureForum</span>
        </button>

        {shouldShowSearch && (
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('forum:header.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-secondary border-none w-full [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-muted rounded-full p-0.5 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
            <PopoverTrigger asChild>
              <button className="hidden md:flex relative p-2 hover:bg-secondary rounded-md transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Badge>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 md:w-96 p-0" align="end">
              <NotificationsDropdown />
            </PopoverContent>
          </Popover>

          {user ? (
            <>
              <div className="md:hidden">
                <button
                  onClick={() => setSideSheetOpen(true)}
                  className="flex items-center gap-2 hover:bg-secondary rounded-md p-1 pr-2 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-teal-600 text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>

                <SideSheet
                  open={sideSheetOpen}
                  onOpenChange={setSideSheetOpen}
                  title={t('common:menu')}
                >
                  <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-teal-600 text-white text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{user.name}</span>
                        {user.isAdmin && (
                          <svg
                            className="h-4 w-4 text-amber-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs mt-1 ${
                          user.isAdmin ? "bg-primary text-primary-foreground" : ""
                        }`}
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <button
                      onClick={() => {
                        if (user.username) navigate(`/profile/${user.username}`);
                        setSideSheetOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <User className="h-5 w-5" />
                      <span>{t('auth:profile')}</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/settings");
                        setSideSheetOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <Settings className="h-5 w-5" />
                      <span>{t('auth:settings')}</span>
                    </button>

                    {(user.isAdmin || user.isModerator) && (
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setSideSheetOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-primary text-left"
                      >
                        <Shield className="h-5 w-5" />
                        <span>{t('forum:header.adminPanel')}</span>
                      </button>
                    )}

                    <div className="border-t border-border my-2" />

                    <button
                      onClick={() => {
                        handleLogout();
                        setSideSheetOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>{t('auth:logout')}</span>
                    </button>
                  </div>

                  <div className="border-t border-border my-4" />

                  <ForumStatsSidebar
                    selectedTag={location.pathname === '/' ? (searchParams.get('tag') || undefined) : undefined}
                    onTagClick={(tagName) => {
                      navigate(`/?tag=${tagName}`);
                      setSideSheetOpen(false);
                    }}
                    isBottomSheet={true}
                  />
                </SideSheet>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 hover:bg-secondary rounded-md p-1 pr-2 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-teal-600 text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{user.name}</span>
                        {user.isAdmin && (
                          <svg
                            className="h-3 w-3 text-amber-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-4 w-fit ${
                          user.isAdmin
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{t('auth:myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => user.username && navigate(`/profile/${user.username}`)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t('auth:profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t('auth:settings')}
                  </DropdownMenuItem>
                  {(user.isAdmin || user.isModerator) && (
                    <DropdownMenuItem
                      className="cursor-pointer text-primary focus:text-primary"
                      onClick={() => navigate("/admin")}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {t('forum:header.adminPanel')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-primary focus:text-primary"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('auth:logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSideSheetOpen(true)}
                className="md:hidden p-2 hover:bg-secondary rounded-md transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="hidden sm:flex gap-2"
              >
                <LogIn className="h-4 w-4" />
                {t('auth:login.signIn')}
              </Button>
              <Button
                size="sm"
                onClick={() => setLoginModalOpen(true)}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('auth:register.title')}</span>
                <span className="sm:hidden">{t('auth:register.title')}</span>
              </Button>
             </div>
           )}
        </div>
      </div>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />

      {!user && (
        <SideSheet
          open={sideSheetOpen}
          onOpenChange={setSideSheetOpen}
          title={t('common:menu')}
        >
          <ForumStatsSidebar
            selectedTag={location.pathname === '/' ? (searchParams.get('tag') || undefined) : undefined}
            onTagClick={(tagName) => {
              navigate(`/?tag=${tagName}`);
              setSideSheetOpen(false);
            }}
            isBottomSheet={true}
          />
        </SideSheet>
      )}
    </header>
  );
}
