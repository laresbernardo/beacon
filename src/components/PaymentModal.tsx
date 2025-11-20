"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, CreditCard, Loader2 } from "lucide-react";

interface PaymentModalProps {
    amount: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export function PaymentModal({ amount, onSuccess, onCancel }: PaymentModalProps) {
    const [processing, setProcessing] = useState(false);

    const handlePay = () => {
        setProcessing(true);
        // Simulate Stripe processing
        setTimeout(() => {
            setProcessing(false);
            onSuccess();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        Secure Escrow Payment
                    </CardTitle>
                    <CardDescription>
                        Your funds will be held safely until you confirm receipt of the item.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                        <span className="font-medium">Total Reward</span>
                        <span className="text-2xl font-bold">€{amount.toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Card Details (Mock)</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="4242 4242 4242 4242"
                                className="pl-9"
                                defaultValue="4242 4242 4242 4242"
                                disabled
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="MM/YY" defaultValue="12/25" disabled />
                            <Input placeholder="CVC" defaultValue="123" disabled />
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground text-center">
                        Powered by Stripe (Test Mode)
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onCancel} disabled={processing}>
                        Cancel
                    </Button>
                    <Button onClick={handlePay} disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `Pay €${amount.toFixed(2)}`
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
