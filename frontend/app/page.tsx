import { Dashboard } from "@/components/dashboard";
import { createMetadata, siteConfig } from "@/lib/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = createMetadata({
  title: "FlawSeeking — Agent Security Dashboard",
  description: siteConfig.description,
  path: "/",
});

export default function HomePage(): ReactNode {
  return <Dashboard />;
}
