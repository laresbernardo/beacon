"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Card } from "@/components/ui/Card";
import { Shield, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/context";

// Fix Leaflet icon issue
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

// Mock Safe Havens with coordinates
const SAFE_HAVENS = [
    {
        id: 1,
        name: "Central Police Station",
        address: "Calle Mayor, 1, Madrid",
        type: "Police Station",
        lat: 40.4168,
        lng: -3.7038
    },
    {
        id: 2,
        name: "Starbucks Gran Vía",
        address: "Gran Vía, 30, Madrid",
        type: "Verified Partner",
        lat: 40.4200,
        lng: -3.6900
    },
    {
        id: 3,
        name: "Metro Sol Info Point",
        address: "Puerta del Sol, Madrid",
        type: "Public Transit",
        lat: 40.4170,
        lng: -3.7033
    }
];

export default function SafeHavensPage() {
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="container py-8 px-4">
                <div className="w-full h-[600px] bg-muted flex items-center justify-center rounded-lg">
                    <p className="text-muted-foreground">{t("map.loading")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Shield className="h-8 w-8 text-primary" />
                    {t("safeHaven.title")}
                </h1>
                <p className="text-muted-foreground">{t("safeHaven.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden h-[600px]">
                        <MapContainer
                            center={[40.4168, -3.7038]}
                            zoom={14}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {SAFE_HAVENS.map((haven) => (
                                <Marker
                                    key={haven.id}
                                    position={[haven.lat, haven.lng]}
                                    icon={customIcon}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <h3 className="font-bold text-sm mb-1">{haven.name}</h3>
                                            <p className="text-xs text-muted-foreground mb-1">{haven.address}</p>
                                            <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                                                {haven.type}
                                            </span>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </Card>
                </div>

                {/* Safe Haven List */}
                <div className="space-y-4">
                    {SAFE_HAVENS.map((haven) => (
                        <Card key={haven.id} className="p-4">
                            <h3 className="font-semibold mb-2">{haven.name}</h3>
                            <p className="text-xs text-muted-foreground flex items-start gap-1 mb-2">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {haven.address}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                                    {haven.type}
                                </span>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Navigation className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
