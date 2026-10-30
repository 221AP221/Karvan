import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { landingMetadata } from "@/components/landing/metadata";
import { getDictionary } from "@/i18n/server";

export const metadata: Metadata = landingMetadata("tr");

export default function Home() {
  return <LandingPage locale="tr" t={getDictionary("tr")} />;
}
