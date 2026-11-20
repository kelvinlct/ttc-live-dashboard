import type { Metadata } from "next";
import { AlertsPanel } from "@/components/alerts-panel";

export const metadata: Metadata = { title: "Service alerts" };

export default function AlertsPage() {
  return <AlertsPanel />;
}
