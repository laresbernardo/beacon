"use client";

import Link from "next/link";
import { Home, Search, PlusCircle, MessageCircle, User, LogOut, Bell } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useNotifications } from "@/lib/notifications/context";

export function Navbar() {
    const { t } = useTranslation();
    const [user, setUser] = useState<any>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    useEffect(() => {
        // Check if user is logged in
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
            setUser(user);
            if (user) {
                fetchUnreadMessages(user.id);
            }
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
            if (session?.user) {
                fetchUnreadMessages(session.user.id);
            } else {
                setUnreadMessageCount(0);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchUnreadMessages = async (userId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('recipient_id', userId)
            .eq('is_read', false);

        if (!error && data) {
            setUnreadMessageCount(data.length);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    const handleNotificationClick = (notification: any) => {
        markAsRead(notification.id);
        setShowNotifications(false);

        // Navigate based on notification type
        if (notification.type === "claim" && notification.itemId) {
            router.push(`/item/${notification.itemId}`);
        } else if (notification.type === "message") {
            if (notification.itemId && notification.fromUserId) {
                router.push(`/chat/${notification.itemId}?userId=${notification.fromUserId}&user=${encodeURIComponent(notification.from)}`);
            } else {
                router.push("/chat");
            }
        } else if (notification.type === "resolution" && notification.itemId) {
            router.push(`/item/${notification.itemId}`);
        }
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                        <div className="bg-primary rounded-md p-1.5">
                            <svg className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v10m-3-3l3 3 3-3" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold">Beacon</span>
                    </div>
                </Link>

                <div className="flex items-center space-x-2 md:space-x-4">
                    <Link
                        href="/"
                        className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                    >
                        <Home className="h-5 w-5" />
                        <span className="hidden sm:inline">{t("nav.home")}</span>
                    </Link>
                    <Link
                        href="/how-it-works"
                        className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                        <span className="hidden sm:inline">{t("nav.howItWorks")}</span>
                    </Link>
                    <Link
                        href="/explore"
                        className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                    >
                        <Search className="h-5 w-5" />
                        <span className="hidden sm:inline">{t("nav.explore")}</span>
                    </Link>
                    <Link
                        href="/report"
                        className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                    >
                        <PlusCircle className="h-5 w-5" />
                        <span className="hidden sm:inline">{t("nav.report")}</span>
                    </Link>
                    <Link
                        href="/chat"
                        className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                    >
                        <MessageCircle className="h-5 w-5" />
                        <span className="hidden sm:inline">{t("nav.chat")}</span>
                    </Link>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent relative"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                                <div className="p-3 border-b flex items-center justify-between">
                                    <h3 className="font-semibold">{t("notifications.title")}</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            {t("notifications.markAllRead")}
                                        </button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                        {t("notifications.empty")}
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <button
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{notification.message}</p>
                                                    {notification.itemTitle && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {notification.itemTitle}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(notification.timestamp).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>



                    {user ? (
                        <div className="flex items-center space-x-2">
                            <Link
                                href={`/profile/${user.id}`}
                                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                            >
                                <User className="h-5 w-5" />
                                <span className="hidden sm:inline text-sm">{user.user_metadata?.full_name || user.email}</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-1 text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-accent"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                        >
                            <User className="h-5 w-5" />
                            <span className="hidden sm:inline">{t("nav.login")}</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Click outside to close dropdown */}
            {showNotifications && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                />
            )}
        </nav>
    );
}
