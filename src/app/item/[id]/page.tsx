"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MapPin, Calendar, DollarSign, MessageCircle, AlertTriangle, ShieldCheck, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { useNotifications } from "@/lib/notifications/context";
import { supabase } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

const ItemMap = dynamic(() => import("@/components/ItemMap").then(mod => mod.default), {
    ssr: false,
    loading: () => <div className="aspect-video bg-muted rounded-lg animate-pulse" />
});

export default function ItemDetailsPage() {
    const params = useParams();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { t } = useTranslation();
    const router = useRouter();
    const { addNotification } = useNotifications();
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: user }: any) => {
            setCurrentUser(user.user);
        });
        fetchItem();
    }, [params.id]);

    const fetchItem = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*, profiles:user_id(full_name, karma_points, is_verified, email)')
                .eq('id', params.id)
                .single();

            if (error) throw error;

            if (data) {
                setItem({
                    ...data,
                    location: data.location_name || `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
                    date: new Date(data.created_at).toLocaleDateString(),
                    imageUrl: data.image_url,
                    images: data.image_url ? [data.image_url] : [], // Support multiple images later
                    user: {
                        name: data.profiles?.full_name || "Anonymous",
                        email: data.profiles?.email,
                        verified: data.profiles?.is_verified,
                        karma: data.profiles?.karma_points
                    },
                    type: data.status,
                    reward: data.reward_amount
                });
            }
        } catch (error) {
            console.error("Error fetching item:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="container py-10 text-center">Loading...</div>;
    }

    if (!item) {
        return <div className="container py-10 text-center">Item not found</div>;
    }

    const images = item.images || [];
    const isOwner = currentUser && item.user_id === currentUser.id;
    const isClaimed = item.claimed_by != null;
    const isClaimedByCurrentUser = currentUser && item.claimed_by === currentUser.id;
    const isFullyResolved = item.resolved_by_reporter && item.resolved_by_claimer;
    const isAdmin = currentUser && currentUser.email === "laresbernardo@gmail.com";

    const handleAdminDelete = async () => {
        if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', item.id);

            if (error) throw error;

            alert("Item deleted successfully!");
            router.push('/explore');
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item.");
        }
    };

    const handleAdminEdit = () => {
        // Save item to sessionStorage for the report page to pick up
        sessionStorage.setItem("editingItem", JSON.stringify(item));
        // Redirect to report page with item ID for editing
        router.push(`/report?edit=${item.id}`);
    };

    const handleClaim = async () => {
        if (!currentUser) {
            router.push("/login");
            return;
        }

        if (confirm(t("item.confirmClaim"))) {
            try {
                // Update item
                const { error } = await supabase
                    .from('items')
                    .update({
                        claimed_by: currentUser.id,
                        claim_timestamp: new Date().toISOString()
                    })
                    .eq('id', item.id);

                if (error) throw error;

                // Create notification
                await supabase.from('notifications').insert({
                    user_id: item.user_id, // Owner
                    type: 'claim',
                    item_id: item.id,
                    from_user_id: currentUser.id,
                    message: `${currentUser.user_metadata?.full_name || "Someone"} claims: "${item.title}"`
                });

                // Refresh item
                fetchItem();
            } catch (error) {
                console.error("Error claiming item:", error);
                alert("Failed to claim item");
            }
        }
    };

    const handleMarkAsResolved = async () => {
        if (!isClaimed) {
            alert("Item must be claimed before it can be resolved.");
            return;
        }

        if (confirm(t("item.confirmResolve"))) {
            try {
                // Update item
                const { error } = await supabase
                    .from('items')
                    .update({
                        resolved_by_reporter: true
                    })
                    .eq('id', item.id);

                if (error) throw error;

                // Create notification for claimer
                if (item.claimed_by) {
                    await supabase.from('notifications').insert({
                        user_id: item.claimed_by,
                        type: 'resolution',
                        item_id: item.id,
                        from_user_id: currentUser.id,
                        message: `Owner marked "${item.title}" as resolved. Please confirm.`
                    });
                }

                fetchItem();
            } catch (error) {
                console.error("Error resolving item:", error);
                alert("Failed to mark as resolved");
            }
        }
    };

    const handleConfirmResolution = async () => {
        try {
            // Update item
            const { error } = await supabase
                .from('items')
                .update({
                    resolved_by_claimer: true,
                    resolved_timestamp: new Date().toISOString()
                })
                .eq('id', item.id);

            if (error) throw error;

            // Create notification for owner
            await supabase.from('notifications').insert({
                user_id: item.user_id,
                type: 'resolution',
                item_id: item.id,
                from_user_id: currentUser.id,
                message: `"${item.title}" has been fully resolved!`
            });

            fetchItem();
        } catch (error) {
            console.error("Error confirming resolution:", error);
            alert("Failed to confirm resolution");
        }
    };

    const handleContact = () => {
        // Navigate to chat with item and user context
        const userName = item.user.name;
        const userId = item.user_id;
        const itemId = item.id;
        const itemTitle = item.title;
        router.push(`/chat/new?user=${encodeURIComponent(userName)}&userId=${encodeURIComponent(userId)}&item=${encodeURIComponent(itemId as string)}&title=${encodeURIComponent(itemTitle)}`);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="container max-w-6xl py-8 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Image Gallery & Map */}
                <div className="lg:col-span-2 space-y-6">
                    {images.length > 0 ? (
                        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                            <img
                                src={images[currentImageIndex]}
                                alt={`${item.title} - Image ${currentImageIndex + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-bold uppercase ${item.type === "lost" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                                }`}>
                                {t(`filter.${item.type}`)}
                            </div>

                            {/* Resolution Status Badge */}
                            {isFullyResolved && (
                                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-bold uppercase bg-green-600 text-white">
                                    {t("item.fullyResolved")}
                                </div>
                            )}

                            {/* Image navigation */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {images.map((_: any, index: number) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}

                    <ItemMap
                        latitude={item.latitude}
                        longitude={item.longitude}
                        title={item.title}
                    />
                </div>

                {/* Right Column: Details & Actions */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
                        <div className="flex items-center text-muted-foreground space-x-4 mb-4">
                            <div className="flex items-center">
                                <MapPin className="mr-1 h-4 w-4" />
                                <span className="truncate max-w-[200px]">{item.location}</span>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="mr-1 h-4 w-4" />
                                <span className="whitespace-nowrap">{item.date}</span>
                            </div>
                        </div>
                        <p className="text-lg">{item.description}</p>
                    </div>

                    {/*  Claim Status */}
                    {isClaimed && !isFullyResolved && (
                        <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="p-4">
                                <p className="text-sm font-semibold text-blue-900">
                                    {t("item.claimedBy")}: {item.claimed_by ? "Claimed" : "Unknown"}
                                </p>
                                {item.resolved_by_reporter && !item.resolved_by_claimer && (
                                    <p className="text-xs text-blue-700 mt-1">{t("item.waitingForClaimer")}</p>
                                )}
                                {!item.resolved_by_reporter && (
                                    <p className="text-xs text-blue-700 mt-1">{t("item.waitingForOwner")}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Reward Card - moved above user info */}
                    <Card className={item.reward && item.reward > 0 ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <DollarSign className={`h-5 w-5 ${item.reward && item.reward > 0 ? 'text-green-600' : 'text-blue-600'}`} />
                                    <span className={`font-semibold ${item.reward && item.reward > 0 ? 'text-green-900' : 'text-blue-900'}`}>
                                        {t("item.reward")}
                                    </span>
                                </div>
                                {item.reward && item.reward > 0 ? (
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-green-600">€{item.reward}</span>
                                        <p className="text-xs text-green-700 mt-1">Cash on delivery</p>
                                    </div>
                                ) : (
                                    <span className="text-xl font-bold text-blue-600">Free</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{t("item.postedBy")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                        {item.user.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.user.name}</p>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <ShieldCheck className="h-3 w-3 mr-1 text-green-600" />
                                            {t("profile.verified")} • {item.user.karma} {t("profile.karma")}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/profile/${item.user_id}`}>
                                        {t("item.viewProfile")}
                                    </Link>
                                </Button>
                            </div>

                            {/* Contact button inside user card */}
                            {!isOwner && !isFullyResolved && (
                                <Button className="w-full" size="lg" onClick={handleContact}>
                                    <MessageCircle className="mr-2 h-5 w-5" />
                                    {item.type === 'lost' ? t("item.contact") : t("item.contactFinder")}
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        {/* Claim button for non-owners */}
                        {!isOwner && !isClaimed && !isFullyResolved && currentUser && (
                            <Button
                                variant="secondary"
                                className="w-full border border-primary/20 hover:bg-primary/10 transition-colors"
                                onClick={handleClaim}
                            >
                                <CheckCircle className="mr-2 h-5 w-5" />
                                {t("item.claim")}
                            </Button>
                        )}

                        {/* Owner resolution button */}
                        {isOwner && isClaimed && !item.resolved_by_reporter && !isFullyResolved && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleMarkAsResolved}
                            >
                                <CheckCircle className="mr-2 h-5 w-5" />
                                {t("item.markResolved")}
                            </Button>
                        )}

                        {/* Claimer confirmation button */}
                        {isClaimedByCurrentUser && item.resolved_by_reporter && !item.resolved_by_claimer && (
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={handleConfirmResolution}
                            >
                                <CheckCircle className="mr-2 h-5 w-5" />
                                {t("item.confirmResolution")}
                            </Button>
                        )}
                    </div>

                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-4">
                            <div className="flex items-start space-x-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div className="text-sm text-yellow-900">
                                    <p className="font-semibold mb-1">{t("item.safetyTip")}</p>
                                    <p>{t("item.safetyMessage")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Controls */}
                    {isAdmin && (
                        <Card className="border-destructive/50 bg-destructive/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-destructive flex items-center">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Admin Controls
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={handleAdminDelete}
                                >
                                    Delete Item
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleAdminEdit}
                                >
                                    Edit Item
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div >
    );
}
