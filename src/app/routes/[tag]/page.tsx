import type { Metadata } from "next";
import { RouteExplorer } from "@/components/route-explorer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return { title: `Route ${tag}` };
}

export default async function RoutePage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return <RouteExplorer tag={tag} />;
}
