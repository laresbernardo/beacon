"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ChatListPage() {
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const router = useRouter();

    useEffect(() => {
        const loadChats = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }
            const userId = session.user.id;

            // Fetch all messages involving the user
            // Note: In a production app, we should have a 'conversations' table or a view
            const { data: messages, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    item:item_id(title),
                    sender:sender_id(full_name, email),
                    recipient:recipient_id(full_name, email)
                `)
                .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching chats:", error);
                setLoading(false);
                return;
            }

            // Group messages by conversation (item_id + other_user_id)
            const conversationsMap = new Map();

            messages?.forEach((msg: any) => {
                const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
                const conversationKey = `${msg.item_id}-${otherUserId}`;

                if (!conversationsMap.has(conversationKey)) {
                    const otherUser = msg.sender_id === userId ? msg.recipient : msg.sender;
                    conversationsMap.set(conversationKey, {
                        id: msg.item_id, // We use item_id as part of the link, but we need otherUserId too
                        itemId: msg.item_id,
                        otherUserId: otherUserId,
                        otherUserName: otherUser?.full_name || otherUser?.email || "User",
                        itemTitle: msg.item?.title || "Item",
                        lastMessage: msg.content,
                        timestamp: msg.created_at,
                        unreadCount: 0
                    });
                }

                // Count unread messages
                if (msg.recipient_id === userId && !msg.is_read) {
                    const conv = conversationsMap.get(conversationKey);
                    conv.unreadCount += 1;
                }
            });

            setChats(Array.from(conversationsMap.values()));
            setLoading(false);
        };

        loadChats();
    }, [router]);

    if (loading) {
        return <div className="container py-8 text-center">Loading...</div>;
    }

    return (
        <div className="container max-w-2xl py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Messages</h1>

            {chats.length === 0 ? (
                <Card className="p-8">
                    <div className="text-center text-muted-foreground">
                        <p className="mb-2">No conversations yet</p>
                        <p className="text-sm">Start chatting by viewing an item and clicking "{t("item.contact")}"</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {chats.map((chat) => (
                        <Link
                            href={`/chat/${chat.itemId}?userId=${chat.otherUserId}&user=${encodeURIComponent(chat.otherUserName)}&title=${encodeURIComponent(chat.itemTitle)}`}
                            key={`${chat.itemId}-${chat.otherUserId}`}
                        >
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardContent className="p-4 flex items-center space-x-4">
                                    <Avatar>
                                        <AvatarFallback>{chat.otherUserName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-semibold truncate">{chat.otherUserName}</h3>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-1">Re: {chat.itemTitle}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {chat.lastMessage}
                                        </p>
                                    </div>
                                    {chat.unreadCount > 0 && (
                                        <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {chat.unreadCount}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
