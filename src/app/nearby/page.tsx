import type { Metadata } from "next";
import { NearbyPanel } from "@/components/nearby-panel";

export const metadata: Metadata = { title: "Nearby stops" };

export default function NearbyPage() {
  return <NearbyPanel />;
}
