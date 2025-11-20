"use client";

import { useTranslation } from "@/lib/i18n/context";
import { Button } from "./Button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
    const { language, setLanguage } = useTranslation();

    const toggleLanguage = () => {
        setLanguage(language === "en" ? "es" : "en");
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center space-x-1"
        >
            <Globe className="h-4 w-4" />
            <span className="uppercase text-xs font-bold">{language}</span>
        </Button>
    );
}
