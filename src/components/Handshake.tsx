"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Scan, CheckCircle2 } from "lucide-react";

interface HandshakeProps {
    transactionId: string;
    role: "loser" | "finder";
    onComplete: () => void;
}

export function Handshake({ transactionId, role, onComplete }: HandshakeProps) {
    const [scanned, setScanned] = useState(false);

    // Mock Scan Function
    const handleScan = () => {
        // In a real app, this would open the camera
        setScanned(true);
        setTimeout(() => {
            onComplete();
        }, 1500);
    };

    if (role === "loser") {
        return (
            <Card className="w-full max-w-sm mx-auto text-center">
                <CardHeader>
                    <CardTitle>Digital Handshake</CardTitle>
                    <CardDescription>
                        Show this QR code to the Finder when you meet to release the reward.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6">
                    <div className="p-4 bg-white rounded-xl shadow-sm border">
                        <QRCodeSVG value={`beacon:transaction:${transactionId}`} size={200} />
                    </div>
                    <p className="text-sm text-muted-foreground bg-yellow-50 text-yellow-800 p-3 rounded-md">
                        ⚠️ Only show this after you have inspected the item!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-sm mx-auto text-center">
            <CardHeader>
                <CardTitle>Scan to Claim</CardTitle>
                <CardDescription>
                    Scan the QR code on the Owner's phone to verify the return and receive your reward.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
                <div className="h-64 w-full bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
                    {scanned ? (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
                        </div>
                    ) : (
                        <>
                            <Scan className="h-12 w-12 text-white/50 animate-pulse" />
                            <div className="absolute inset-0 border-2 border-white/30 rounded-xl m-8"></div>
                        </>
                    )}
                </div>
                <Button size="lg" className="w-full" onClick={handleScan} disabled={scanned}>
                    {scanned ? "Verifying..." : "Simulate Scan (Camera Mock)"}
                </Button>
            </CardContent>
        </Card>
    );
}
