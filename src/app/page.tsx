"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-muted flex items-center justify-center rounded-lg">Loading Map...</div>
});

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {t("hero.title1")}
              <br />
              {t("hero.title2")}
            </h1>
            <p className="text-xl text-muted-foreground md:text-2xl max-w-[700px] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
              <Button size="lg" className="text-lg px-8 bg-orange-500 hover:bg-orange-600" asChild>
                <Link href="/report">{t("hero.cta")}</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link href="/explore">{t("nav.explore")}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-orange-900/20"></div>
      </section>

      {/* Map Section */}
      <section className="flex-1 bg-muted/30 py-12">
        <div className="container px-4 md:px-6">
          <div className="bg-card rounded-xl shadow-lg border p-2 md:p-4 h-[600px]">
            <MapComponent />
          </div>
        </div>
      </section>
    </div>
  );
}
