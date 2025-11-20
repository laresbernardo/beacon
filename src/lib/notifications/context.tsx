"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";

export interface Notification {
    id: string;
    type: "claim" | "message" | "resolution";
    itemId?: string;
    itemTitle?: string;
    from: string;
    fromUserId?: string;
    to: string;
    message: string;
    read: boolean;
    timestamp: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    getNotifications: () => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // Get current user
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
            if (user) {
                setUserId(user.id);
                fetchNotifications(user.id);
                subscribeToNotifications(user.id);
            }
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
            if (session?.user) {
                setUserId(session.user.id);
                fetchNotifications(session.user.id);
                subscribeToNotifications(session.user.id);
            } else {
                setUserId(null);
                setNotifications([]);
                setUnreadCount(0);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchNotifications = async (uid: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                sender:from_user_id(full_name, email),
                item:item_id(title)
            `)
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching notifications:", error);
            return;
        }

        const formattedNotifications = (data || []).map((n: any) => ({
            id: n.id,
            type: n.type,
            itemId: n.item_id,
            itemTitle: n.item?.title,
            from: n.sender?.full_name || n.sender?.email || "Unknown",
            fromUserId: n.from_user_id,
            to: uid, // Current user
            message: n.message,
            read: n.is_read,
            timestamp: n.created_at
        }));

        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter((n: any) => !n.read).length);
    };

    const subscribeToNotifications = (uid: string) => {
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${uid}`
                },
                (payload: any) => {
                    console.log('New notification received:', payload);
                    fetchNotifications(uid); // Refresh list
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const addNotification = async (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
        // This function is now mostly for client-side optimistic updates or manual triggering
        // In a real app, notifications are usually triggered by database triggers or backend logic
        // But we'll keep it to insert into DB for now

        // Note: We need the actual user_id for 'to' and 'from', not just names/emails
        // This might require adjusting how addNotification is called in components
        // For now, we'll assume the caller handles the DB insertion if they have the IDs,
        // or we just log a warning if we can't insert.

        // Actually, let's just rely on the components inserting directly into Supabase
        // and this context just listening. 
        // But to maintain API compatibility with existing code:
        console.warn("addNotification called. Ensure components insert directly to Supabase 'notifications' table for persistence.");
    };

    const markAsRead = async (notificationId: string) => {
        // Optimistic update
        const updated = notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        );
        setNotifications(updated);
        setUnreadCount(updated.filter(n => !n.read).length);

        // DB Update
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error("Error marking notification as read:", error);
            // Revert on error?
        }
    };

    const markAllAsRead = async () => {
        // Optimistic update
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        setUnreadCount(0);

        if (!userId) return;

        // DB Update
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);

        if (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const getNotifications = () => notifications;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                getNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
