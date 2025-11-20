"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapPin, Shield, Navigation } from "lucide-react";
import Link from "next/link";

// Mock Safe Havens
const SAFE_HAVENS = [
    {
        id: 1,
        name: "Central Police Station",
        address: "Calle Mayor, 1, Madrid",
        type: "Police Station",
        distance: "0.5 km"
    },
    {
        id: 2,
        name: "Starbucks Gran Vía",
        address: "Gran Vía, 30, Madrid",
        type: "Verified Partner",
        distance: "1.2 km"
    },
    {
        id: 3,
        name: "Metro Sol Info Point",
        address: "Puerta del Sol, Madrid",
        type: "Public Transit",
        distance: "0.8 km"
    }
];

export function SafeHavenLocator() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Nearby Safe Havens
                </CardTitle>
                <CardDescription>
                    Meet at these verified locations for a safe exchange.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {SAFE_HAVENS.map((haven) => (
                    <div key={haven.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{haven.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {haven.address}
                            </p>
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                {haven.type}
                            </span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-xs font-bold">{haven.distance}</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Navigation className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                <Button variant="outline" className="w-full text-xs" asChild>
                    <Link href="/safe-havens">View All Safe Havens on Map</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
