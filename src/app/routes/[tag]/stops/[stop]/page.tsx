import type { Metadata } from "next";
import { StopBoard } from "@/components/stop-board";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string; stop: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return { title: `Arrivals · route ${tag}` };
}

export default async function StopPage({
  params,
}: {
  params: Promise<{ tag: string; stop: string }>;
}) {
  const { tag, stop } = await params;
  return <StopBoard routeTag={tag} stopTag={stop} />;
}
