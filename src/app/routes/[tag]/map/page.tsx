import type { Metadata } from "next";
import { RouteMapView } from "@/components/route-map-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return { title: `Map · route ${tag}` };
}

export default async function RouteMapPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return <RouteMapView tag={tag} />;
}
