"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PaymentModal } from "@/components/PaymentModal";
import { Handshake } from "@/components/Handshake";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

type TransactionStep = "payment" | "handshake" | "completed";

export default function TransactionPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const role = (searchParams.get("role") as "loser" | "finder") || "loser";

    // Mock state
    const [step, setStep] = useState<TransactionStep>(role === "finder" ? "handshake" : "payment");

    const handlePaymentSuccess = () => {
        setStep("handshake");
    };

    const handleHandshakeComplete = () => {
        setStep("completed");
    };

    if (step === "completed") {
        return (
            <div className="container max-w-md py-12 px-4 text-center space-y-6">
                <div className="flex justify-center">
                    <CheckCircle2 className="h-24 w-24 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold">Transaction Complete!</h1>
                <p className="text-muted-foreground">
                    The item has been returned and the reward has been transferred.
                </p>
                <div className="pt-6">
                    <Button asChild className="w-full">
                        <Link href="/">Return Home</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-md py-8 px-4">
            {step === "payment" && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Confirm Reward</h1>
                        <p className="text-muted-foreground">
                            Secure the funds in escrow to proceed with the meetup.
                        </p>
                    </div>
                    <PaymentModal
                        amount={20}
                        onSuccess={handlePaymentSuccess}
                        onCancel={() => window.history.back()}
                    />
                </div>
            )}

            {step === "handshake" && (
                <div className="space-y-6">
                    <Handshake
                        transactionId={params.id as string}
                        role={role}
                        onComplete={handleHandshakeComplete}
                    />
                </div>
            )}
        </div>
    );
}
