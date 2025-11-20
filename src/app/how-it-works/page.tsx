"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MapPin, Search, MessageCircle, CheckCircle, Shield, Heart } from "lucide-react";

import { useTranslation } from "@/lib/i18n/context";

export default function HowItWorksPage() {
    const { t } = useTranslation();

    return (
        <div className="container max-w-4xl py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {t("how.title")}
                </h1>
                <p className="text-xl text-muted-foreground">
                    {t("how.subtitle")}
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 mb-16">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Search className="h-6 w-6 text-primary" />
                            {t("how.lostTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                                <h3 className="font-semibold">{t("how.lostStep1Title")}</h3>
                                <p className="text-sm text-muted-foreground">{t("how.lostStep1Desc")}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h3 className="font-semibold">{t("how.lostStep2Title")}</h3>
                                <p className="text-sm text-muted-foreground">{t("how.lostStep2Desc")}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h3 className="font-semibold">{t("how.lostStep3Title")}</h3>
                                <p className="text-sm text-muted-foreground">{t("how.lostStep3Desc")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Heart className="h-6 w-6 text-green-600" />
                            {t("how.foundTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                                <h3 className="font-semibold">{t("how.foundStep1Title")}</h3>
                                <p className="text-sm text-muted-foreground">{t("how.foundStep1Desc")}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                                <h3 className="font-semibold">{t("how.foundStep2Title")}</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    {t("how.foundStep2Desc")}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                                <h3 className="font-semibold">{t("how.foundStep3Title")}</h3>
                                <p className="text-sm text-muted-foreground">{t("how.foundStep3Desc")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-center">{t("how.guidelinesTitle")}</h2>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-4">
                        <Shield className="h-10 w-10 text-blue-500 mb-3" />
                        <h3 className="font-semibold mb-2">{t("how.safetyTitle")}</h3>
                        <p className="text-sm text-muted-foreground">{t("how.safetyDesc")}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4">
                        <MessageCircle className="h-10 w-10 text-purple-500 mb-3" />
                        <h3 className="font-semibold mb-2">{t("how.respectTitle")}</h3>
                        <p className="text-sm text-muted-foreground">{t("how.respectDesc")}</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4">
                        <CheckCircle className="h-10 w-10 text-orange-500 mb-3" />
                        <h3 className="font-semibold mb-2">{t("how.limitsTitle")}</h3>
                        <p className="text-sm text-muted-foreground">{t("how.limitsDesc")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
