"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface ItemCardProps {
    id: string;
    title: string;
    description: string;
    type: "lost" | "found";
    location: string;
    date: string;
    imageUrl?: string;
    reward?: number;
    latitude?: number;
    longitude?: number;
}

export function ItemCard({ id, title, description, type, location, date, imageUrl, reward, latitude, longitude }: ItemCardProps) {
    const { t } = useTranslation();

    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="w-full relative bg-muted" style={{ paddingBottom: '56.25%' }}>
                <div className="absolute inset-0">
                    {imageUrl ? (
                        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        // Dynamic map based on item's actual coordinates
                        <div className="absolute inset-0 w-full h-full overflow-hidden bg-muted">
                            <img
                                src={`https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${longitude || -3.7038},${latitude || 40.4168}&z=13&l=map&size=600,300&pt=${longitude || -3.7038},${latitude || 40.4168},pm2rdm`}
                                alt="Map Location"
                                className="w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MapPin className="h-8 w-8 text-primary drop-shadow-md" />
                            </div>
                        </div>
                    )}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold uppercase ${type === "lost" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                        }`}>
                        {t(`filter.${type}`)}
                    </div>
                    {reward && reward > 0 && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-green-600 text-white">
                            {t("item.reward")}: €{reward}
                        </div>
                    )}
                </div>
            </div>
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {description}
                </p>
                <div className="flex items-center text-xs text-muted-foreground space-x-4">
                    <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        <span className="line-clamp-1">{location}</span>
                    </div>
                    <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>{date}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 mt-auto">
                <Button className="w-full" variant="secondary" asChild>
                    <Link href={`/item/${id}`}>{t("item.details")}</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
