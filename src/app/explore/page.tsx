"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ItemCard } from "@/components/ItemCard";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase/client";

export default function ExplorePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found" | "resolved">("all");
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            // Fetch items from Supabase
            const { data, error } = await supabase
                .from('items')
                .select('*, profiles:user_id(full_name, karma_points, is_verified)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Format items
            const formattedItems = (data || []).map((item: any) => ({
                ...item,
                location: item.location_name || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`,
                date: new Date(item.created_at).toLocaleDateString(),
                timestamp: new Date(item.created_at).getTime(),
                user: item.profiles, // Map joined profile data
                imageUrl: item.image_url,
                type: item.status, // Map status to type
                reward: item.reward_amount
            }));

            setItems(formattedItems);
        } catch (error) {
            console.error("Error fetching items:", error);
            // Fallback to mock data if DB fails (e.g. during dev/migration)
            // or just show empty state
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter((item) => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Filter logic:
        // - If filter is "resolved", show only fully resolved items.
        // - If filter is "all", "lost", or "found", show items matching that status AND NOT fully resolved.

        const isResolved = item.resolved_by_reporter && item.resolved_by_claimer;

        if (typeFilter === "resolved") {
            return matchesSearch && isResolved;
        } else {
            const matchesType = typeFilter === "all" || item.type === typeFilter;
            return matchesSearch && matchesType && !isResolved;
        }
    });

    return (
        <div className="container py-8 px-4">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("explore.search")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={typeFilter === "all" ? "default" : "outline"}
                        onClick={() => setTypeFilter("all")}
                    >
                        {t("filter.all")}
                    </Button>
                    <Button
                        variant={typeFilter === "lost" ? "destructive" : "outline"}
                        onClick={() => setTypeFilter("lost")}
                    >
                        {t("filter.lost")}
                    </Button>
                    <Button
                        variant={typeFilter === "found" ? "default" : "outline"}
                        onClick={() => setTypeFilter("found")}
                        className={typeFilter === "found" ? "bg-primary" : ""}
                    >
                        {t("filter.found")}
                    </Button>
                    <Button
                        variant={typeFilter === "resolved" ? "default" : "outline"}
                        onClick={() => setTypeFilter("resolved")}
                        className={typeFilter === "resolved" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        {t("filter.resolved")}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>{t("explore.noResults")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                        <ItemCard
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            description={item.description}
                            type={item.type}
                            location={item.location}
                            date={item.date}
                            imageUrl={item.imageUrl || (item.images && item.images[0])}
                            reward={item.reward}
                            latitude={item.latitude}
                            longitude={item.longitude}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
