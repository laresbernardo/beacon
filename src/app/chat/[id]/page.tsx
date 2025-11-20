"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Send, AlertTriangle, ShieldCheck } from "lucide-react";
import { ReportModal } from "@/components/ReportModal";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [item, setItem] = useState<any>(null);
    const [itemId, setItemId] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Resolve async params (Next.js 15+)
    useEffect(() => {
        params.then(resolvedParams => {
            const id = resolvedParams.id === "new" ? searchParams.get("item") : resolvedParams.id;
            setItemId(id);
        });
    }, [params, searchParams]);

    // Determine Other User ID
    const otherUserIdParam = searchParams.get("userId");

    // Fallback for display names if we haven't fetched profile yet
    const otherUserNameParam = searchParams.get("user") || "User";
    const itemTitleParam = searchParams.get("title") || "Item";

    useEffect(() => {
        const initChat = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login?message=Please login to access chat");
                return;
            }
            setCurrentUser(session.user);

            if (!itemId || !otherUserIdParam) {
                // If we don't have IDs, we can't load the chat
                return;
            }

            // Fetch Item Details
            const { data: itemData } = await supabase
                .from('items')
                .select('title, user_id')
                .eq('id', itemId)
                .single();

            if (itemData) setItem(itemData);

            // Fetch Other User Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', otherUserIdParam)
                .single();

            if (profileData) setOtherUser(profileData);

            // Fetch Messages
            fetchMessages(session.user.id, otherUserIdParam, itemId);

            // Subscribe to new messages
            const channel = supabase
                .channel(`chat:${itemId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `item_id=eq.${itemId}`
                    },
                    (payload: any) => {
                        const newMsg = payload.new;
                        // Only add if it belongs to this conversation (between these two users)
                        if (
                            (newMsg.sender_id === session.user.id && newMsg.recipient_id === otherUserIdParam) ||
                            (newMsg.sender_id === otherUserIdParam && newMsg.recipient_id === session.user.id)
                        ) {
                            fetchMessages(session.user.id, otherUserIdParam, itemId);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        initChat();
    }, [itemId, otherUserIdParam, router]);

    const fetchMessages = async (myId: string, otherId: string, iId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('item_id', iId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
        } else {
            // Filter messages in JS because mock client ignores complex .or()
            const filteredMessages = (data || []).filter((msg: any) =>
                (msg.sender_id === myId && msg.recipient_id === otherId) ||
                (msg.sender_id === otherId && msg.recipient_id === myId)
            );

            setMessages(filteredMessages);
            scrollToBottom();

            // Mark unread messages as read
            const unreadIds = filteredMessages
                .filter((msg: any) => !msg.is_read && msg.recipient_id === myId)
                .map((msg: any) => msg.id);

            if (unreadIds.length > 0) {
                await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .in('id', unreadIds);

                // Also update notifications
                await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('item_id', iId)
                    .eq('user_id', myId);
            }
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!message.trim()) return;

        if (!currentUser) {
            alert("Error: You are not logged in.");
            return;
        }
        if (!otherUserIdParam) {
            alert("Error: Recipient ID is missing. Please go back and try again.");
            return;
        }
        if (!itemId) {
            alert("Error: Item ID is missing. Please go back and try again.");
            return;
        }

        // Basic Content Moderation (Keyword Filter)
        const unsafeKeywords = ["bank", "transfer", "cash", "wire", "account number"];
        if (unsafeKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
            alert("Safety Warning: For your protection, please avoid sharing financial details or arranging bank transfers. Use the secure escrow system.");
            return;
        }

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    item_id: itemId,
                    sender_id: currentUser.id,
                    recipient_id: otherUserIdParam,
                    content: message,
                    is_read: false
                });

            if (error) throw error;

            // Send notification to recipient
            await supabase.from('notifications').insert({
                user_id: otherUserIdParam,
                type: 'message',
                item_id: itemId,
                from_user_id: currentUser.id,
                message: `New message from ${currentUser.user_metadata?.full_name || "User"}`
            });

            setMessage("");
            // Optimistic update or wait for subscription
            fetchMessages(currentUser.id, otherUserIdParam, itemId);
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        }
    };

    const displayOtherName = otherUser?.full_name || otherUserNameParam;
    const displayItemTitle = item?.title || itemTitleParam;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="p-4 border-b bg-background flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <Avatar>
                        <AvatarFallback>{displayOtherName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold">{displayOtherName}</h2>
                        <p className="text-xs text-muted-foreground">Regarding: {displayItemTitle}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowReportModal(true)}>
                    <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <p>
                        <strong>Safety Tip:</strong> Meet in a public place (Safe Haven). Never transfer money before inspecting the item.
                    </p>
                </div>

                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${isMe
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                    }`}
                            >
                                <p className="text-sm">{msg.content}</p>
                                <span className="text-xs opacity-70 mt-1 block">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSend} className="flex space-x-2">
                    <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button type="submit">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <div className="mt-2 flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                        <ShieldCheck className="inline h-3 w-3 mr-1 text-green-600" />
                        Chat is monitored for safety.
                    </p>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive h-auto p-0 hover:bg-transparent" onClick={() => setShowReportModal(true)}>
                        Report User
                    </Button>
                </div>
            </div>

            <ReportModal
                targetUser={displayOtherName}
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
            />
        </div>
    );
}
