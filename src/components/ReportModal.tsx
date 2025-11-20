"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { AlertTriangle, Check } from "lucide-react";

interface ReportModalProps {
    targetUser: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ReportModal({ targetUser, isOpen, onClose }: ReportModalProps) {
    const [reason, setReason] = useState("");
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = () => {
        // Mock submission
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setReason("");
            onClose();
        }, 2000);
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center p-6">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold">Report Submitted</h3>
                    <p className="text-muted-foreground mt-2">
                        Thank you for keeping our community safe. We will review this report immediately.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Report User
                    </CardTitle>
                    <CardDescription>
                        Reporting {targetUser}. Please select a reason.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {["Suspicious Behavior", "Harassment", "Scam/Fraud", "Inappropriate Content"].map((r) => (
                            <Button
                                key={r}
                                variant={reason === r ? "default" : "outline"}
                                className="text-xs"
                                onClick={() => setReason(r)}
                            >
                                {r}
                            </Button>
                        ))}
                    </div>
                    <Textarea
                        placeholder="Provide more details (optional)..."
                        className="resize-none"
                    />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={!reason}>
                        Submit Report
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
