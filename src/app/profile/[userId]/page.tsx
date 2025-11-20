"use client";
// Force rebuild

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, HelpCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const { t } = useTranslation();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            // Check if user is logged in first
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Then fetch profile with currentUser available
            await fetchProfile(user);
        };

        loadData();
    }, [userId]);

    const fetchProfile = async (user: any = null) => {
        setLoading(true);
        try {
            // Try to find by ID
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // Self-repair: If profile not found but it matches current user's ID, create it
            if (!data && user && user.id === userId) {
                console.log("Profile not found for current user, creating one...");
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                        email: user.email,
                        role: user.email === "laresbernardo@gmail.com" ? "admin" : "user"
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error("Error creating profile:", createError);
                } else {
                    data = newProfile;
                }
            }

            if (data) {
                // Calculate stats from items
                const { data: items } = await supabase
                    .from('items')
                    .select('*')
                    .eq('user_id', data.id);

                const itemsFound = items?.filter((i: any) => i.status === 'found').length || 0;
                // Count items as returned if status is 'returned' OR if they are fully resolved
                const itemsReturned = items?.filter((i: any) => i.status === 'returned' || (i.resolved_by_reporter && i.resolved_by_claimer)).length || 0;
                // Simple karma calculation for now, or use the one in DB if updated
                const karma = data.karma_points || (itemsFound * 10) + (itemsReturned * 20);

                setProfile({
                    ...data,
                    itemsFound,
                    itemsReturned,
                    karma,
                    joinedDate: new Date(data.created_at).toLocaleDateString()
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="container py-10 text-center">Loading profile...</div>;
    }

    if (!profile) {
        return <div className="container py-10 text-center">User not found</div>;
    }

    const isOwnProfile = currentUser && currentUser.id === profile.id;
    const isAdmin = currentUser && currentUser.email === "laresbernardo@gmail.com";

    return (
        <div className="container max-w-3xl py-8 px-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                                {profile.full_name?.[0] || profile.email?.[0] || "?"}
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{profile.full_name || profile.email}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    {profile.is_verified && (
                                        <div className="flex items-center text-sm text-green-600 group relative">
                                            <ShieldCheck className="h-4 w-4 mr-1" />
                                            {t("profile.verified")}
                                            <HelpCircle className="h-3 w-3 ml-1 opacity-50" />
                                            <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg z-10">
                                                {t("profile.verifiedTooltip")}
                                            </div>
                                        </div>
                                    )}
                                    <span className="text-sm text-muted-foreground group relative cursor-help">
                                        • {profile.karma} {t("profile.karma")}
                                        <HelpCircle className="inline h-3 w-3 ml-1 opacity-50" />
                                        <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg z-10">
                                            {t("profile.karmaTooltip")}
                                        </div>
                                    </span>
                                </div>
                            </div>
                        </div>
                        {isAdmin && isOwnProfile && (
                            <Button variant="outline" asChild>
                                <Link href="/admin">Admin Dashboard</Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="text-3xl font-bold text-primary">{profile.itemsFound}</div>
                                <div className="text-sm text-muted-foreground mt-1">{t("profile.itemsFound")}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="text-3xl font-bold text-green-600">{profile.itemsReturned}</div>
                                <div className="text-sm text-muted-foreground mt-1">{t("profile.itemsReturned")}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">{t("profile.memberSince")}</h3>
                        <p className="text-sm text-muted-foreground">{profile.joinedDate}</p>
                    </div>

                    {/* Transaction History */}
                    <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-3">
                            {isOwnProfile ? t("profile.myItems") : t("profile.userTransactions")}
                        </h3>
                        <TransactionHistory userId={profile.id} isOwnProfile={isOwnProfile} />
                    </div>

                    {!isOwnProfile && (
                        <div className="pt-4">
                            <Button className="w-full" asChild>
                                <Link href={`/chat/new?user=${encodeURIComponent(profile.full_name || profile.email)}&userId=${profile.id}`}>{t("profile.sendMessage")}</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function TransactionHistory({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
    const [items, setItems] = useState<any[]>([]);
    const { t } = useTranslation();
    const router = useRouter();

    useEffect(() => {
        loadItems();
    }, [userId]);

    const loadItems = async () => {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) console.error("Error loading items:", error);
        else setItems(data || []);
    };

    const handleDelete = async (itemId: string) => {
        if (confirm(t("profile.confirmDelete"))) {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', itemId);

            if (error) {
                console.error("Error deleting item:", error);
                alert("Failed to delete item");
            } else {
                loadItems();
            }
        }
    };

    const handleEdit = (item: any) => {
        // Store item in sessionStorage for editing
        sessionStorage.setItem("editingItem", JSON.stringify(item));
        router.push("/report");
    };

    if (items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                {isOwnProfile ? t("profile.noItems") : t("profile.noUserTransactions")}
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full ${item.status === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {t(`filter.${item.status}`) || item.status}
                            </span>
                            <h4 className="text-sm font-medium truncate">{item.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/item/${item.id}`}>{t("profile.view")}</Link>
                        </Button>
                        {isOwnProfile && (
                            <>
                                <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                                    {t("profile.edit")}
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                                    {t("profile.delete")}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
