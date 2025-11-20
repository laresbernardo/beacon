"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { MapPin, Upload, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-40 bg-muted rounded-md flex items-center justify-center">Loading Map...</div>
});

export default function ReportPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"lost" | "found">("lost");
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationText, setLocationText] = useState<string>("");
    const [useMapLocation, setUseMapLocation] = useState(true);
    const [images, setImages] = useState<string[]>([]);
    const [reward, setReward] = useState<string>("0");
    const [returnMethod, setReturnMethod] = useState<"left_it" | "pickup" | "chat">("chat");
    const [pickupAddress, setPickupAddress] = useState("");

    const [loading, setLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { t } = useTranslation();

    // Load editing item from sessionStorage on mount
    useEffect(() => {
        const editingItemStr = sessionStorage.getItem("editingItem");
        if (editingItemStr) {
            const item = JSON.parse(editingItemStr);
            setEditingItemId(item.id);
            setTitle(item.title || "");
            setDescription(item.description || "");
            setType(item.type || "lost");
            setReward(item.reward?.toString() || "");
            setImages(item.images || []);

            if (item.return_method) setReturnMethod(item.return_method);
            if (item.pickup_address) setPickupAddress(item.pickup_address);

            // Handle location
            if (typeof item.location === 'object' && item.location.lat) {
                setLocation(item.location);
                setUseMapLocation(true);
            } else if (typeof item.location === 'string') {
                setLocationText(item.location);
                setUseMapLocation(false);
            }

            // Clear sessionStorage after loading
            sessionStorage.removeItem("editingItem");
        }
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const checkLimits = async (userId: string, isPaid: boolean) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Check total items
        const { count: totalCount, error: totalError } = await supabase
            .from('items')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', startOfMonth);

        if (totalError) throw totalError;
        if ((totalCount || 0) >= 20) return "You have reached the monthly limit of 20 reports.";

        // Check paid items if applicable
        if (isPaid) {
            const { count: paidCount, error: paidError } = await supabase
                .from('items')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gt('reward_amount', 0)
                .gte('created_at', startOfMonth);

            if (paidError) throw paidError;
            if ((paidCount || 0) >= 4) return "You have reached the monthly limit of 4 paid reports.";
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert(t("auth.loginRequired"));
                router.push("/login");
                return;
            }

            // Validation for Found items
            if (type === "found") {
                if (images.length === 0) {
                    alert("Image upload is mandatory for found items.");
                    setLoading(false);
                    return;
                }
                if (returnMethod === "pickup" && !pickupAddress) {
                    alert("Please provide a pickup address.");
                    setLoading(false);
                    return;
                }
            }

            // Check Limits
            const isPaid = type === "lost" && parseFloat(reward) > 0;
            if (!editingItemId) { // Only check limits for new items
                const limitError = await checkLimits(user.id, isPaid);
                if (limitError) {
                    alert(limitError);
                    setLoading(false);
                    return;
                }
            }

            let imageUrl = images.length > 0 ? images[0] : null;

            const itemData = {
                user_id: user.id,
                title,
                description,
                status: type,
                latitude: useMapLocation && location ? location.lat : 40.4168,
                longitude: useMapLocation && location ? location.lng : -3.7038,
                location_name: locationText,
                image_url: imageUrl,
                reward_amount: type === "found" ? 0 : (reward ? parseFloat(reward) : 0),
                is_free: type === "found" || (reward ? parseFloat(reward) === 0 : true),
                return_method: type === "found" ? returnMethod : null,
                pickup_address: type === "found" && returnMethod === "pickup" ? pickupAddress : null,
                updated_at: new Date().toISOString(),
            };

            if (editingItemId) {
                const { error } = await supabase
                    .from('items')
                    .update(itemData)
                    .eq('id', editingItemId)
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('items')
                    .insert([itemData]);

                if (error) throw error;
            }

            setImages([]);
            setTitle("");
            setDescription("");
            setReward("");
            setPickupAddress("");

            router.push("/explore");
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-10 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>{editingItemId ? t("report.editTitle") : t("report.title")}</CardTitle>
                    <CardDescription>
                        {t("report.itemType")}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="flex space-x-4">
                            <Button
                                type="button"
                                variant={type === "lost" ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setType("lost")}
                            >
                                {t("report.lost")}
                            </Button>
                            <Button
                                type="button"
                                variant={type === "found" ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setType("found")}
                            >
                                {t("report.found")}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium">{t("report.itemTitle")}</label>
                            <Input
                                id="title"
                                placeholder="e.g. Red Leather Wallet"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium">{t("report.itemDescription")}</label>
                            <Textarea
                                id="description"
                                placeholder="Provide details..."
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Return Method for Found Items */}
                        {type === "found" && (
                            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                                <label className="text-sm font-medium">How will you return it?</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        type="button"
                                        variant={returnMethod === "left_it" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setReturnMethod("left_it")}
                                    >
                                        I left it there
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={returnMethod === "pickup" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setReturnMethod("pickup")}
                                    >
                                        Pick up
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={returnMethod === "chat" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setReturnMethod("chat")}
                                    >
                                        Agree by Chat
                                    </Button>
                                </div>
                                {returnMethod === "pickup" && (
                                    <div className="mt-2">
                                        <label className="text-xs font-medium">Pickup Address</label>
                                        <Input
                                            placeholder="Enter address for pickup..."
                                            value={pickupAddress}
                                            onChange={(e) => setPickupAddress(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("report.location")}</label>

                            {/* Toggle between map and text input */}
                            <div className="flex gap-2 mb-2">
                                <Button
                                    type="button"
                                    variant={useMapLocation ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => setUseMapLocation(true)}
                                >
                                    {t("report.useMap")}
                                </Button>
                                <Button
                                    type="button"
                                    variant={!useMapLocation ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => setUseMapLocation(false)}
                                >
                                    {t("report.useAddress")}
                                </Button>
                            </div>

                            {useMapLocation ? (
                                showMap ? (
                                    <LocationPicker onLocationSelect={setLocation} />
                                ) : (
                                    <div
                                        className="h-40 bg-muted rounded-md flex items-center justify-center border border-dashed cursor-pointer hover:bg-muted/80 transition-colors"
                                        onClick={() => setShowMap(true)}
                                    >
                                        <div className="text-center text-muted-foreground">
                                            <MapPin className="mx-auto h-8 w-8 mb-2" />
                                            <span>{location ? `Selected: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : t("report.tapLocation")}</span>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <Input
                                    placeholder={t("report.addressPlaceholder")}
                                    value={locationText}
                                    onChange={(e) => setLocationText(e.target.value)}
                                    required={!useMapLocation}
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t("report.uploadImages")} {type === "found" && <span className="text-destructive">*</span>}
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                            {images.length === 0 ? (
                                <div
                                    className={`h-32 bg-muted rounded-md flex items-center justify-center border border-dashed cursor-pointer hover:bg-muted/80 transition-colors ${type === "found" ? "border-destructive/50" : ""}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="text-center text-muted-foreground">
                                        <Upload className="mx-auto h-8 w-8 mb-2" />
                                        <span>{t("report.uploadImages")}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative aspect-square">
                                            <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover rounded-md" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <div
                                        className="aspect-square bg-muted rounded-md flex items-center justify-center border border-dashed cursor-pointer hover:bg-muted/80"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {type === "lost" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t("report.reward")}
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="25"
                                    step="1"
                                    placeholder="e.g. 15"
                                    value={reward}
                                    onChange={(e) => setReward(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t("report.rewardHint")}
                                </p>
                            </div>
                        )}

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Submitting..." : t("report.submit")}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
