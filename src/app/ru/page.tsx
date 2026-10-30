import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { landingMetadata } from "@/components/landing/metadata";
import { getDictionary } from "@/i18n/server";

export const metadata: Metadata = landingMetadata("ru");

export default function Home() {
  return <LandingPage locale="ru" t={getDictionary("ru")} />;
}
