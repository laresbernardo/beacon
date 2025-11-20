"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { MapPin } from "lucide-react";

// Fix Leaflet icon issue in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function MapComponent() {
    const [mounted, setMounted] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const { supabase } = require("@/lib/supabase/client"); // Dynamic import to avoid SSR issues if needed, or just standard import

    useEffect(() => {
        setMounted(true);
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .in('status', ['lost', 'found']); // Only active items

            if (error) throw error;

            // Filter out fully resolved items
            const activeItems = (data || []).filter((item: any) =>
                !(item.resolved_by_reporter && item.resolved_by_claimer)
            );

            const formattedItems = activeItems.map((item: any) => ({
                id: item.id,
                title: item.title,
                type: item.status,
                lat: item.latitude,
                lng: item.longitude,
                description: item.description,
            }));

            setItems(formattedItems);
        } catch (error) {
            console.error("Error fetching map items:", error);
        }
    };

    if (!mounted) {
        return (
            <div className="w-full h-[500px] bg-muted flex items-center justify-center rounded-lg">
                <p className="text-muted-foreground">Loading Map...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[500px] rounded-lg overflow-hidden border shadow-sm">
            <MapContainer
                center={[40.4168, -3.7038]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {items.map((item) => (
                    <Marker
                        key={item.id}
                        position={[item.lat, item.lng]}
                        icon={customIcon}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full ${item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {item.type}
                                    </span>
                                </div>
                                <h3 className="font-bold text-sm">{item.title}</h3>
                                <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                                <a href={`/item/${item.id}`} className="text-xs text-blue-600 hover:underline">
                                    View Details
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Live Activity</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                    Showing {items.length} active reports in Madrid.
                </p>
            </div>
        </div>
    );
}
