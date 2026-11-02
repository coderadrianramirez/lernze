import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverFeed } from "@/components/DiscoverFeed";
import { getCurrentUser } from "@/lib/auth";
import { listCourses, getUserInterests } from "@/lib/data";
import { listPublicCreators } from "@/lib/creators";
import { courseCreatorId } from "@/lib/creator-path";
import { recommendationActivity } from "@/lib/recommendation-data";
import { recommendPrograms } from "@/lib/recommendations";

export const metadata: Metadata = { title: "Descubrir", description: "Una idea, un creador, algo nuevo que aprender. Descubre programas a través de sus trailers." };

export default function DiscoverPage() {
  return <main className="discover-page"><Suspense fallback={<div className="discover-loading" role="status">Preparando tu próxima idea…</div>}><Content /></Suspense></main>;
}

async function Content() {
  const [catalogue, user] = await Promise.all([listCourses(), getCurrentUser()]);
  const signed = Boolean(user && !user.demo);
  const [chosen, activity] = signed
    ? await Promise.all([getUserInterests(user!.id), recommendationActivity(user!.id)])
    : [[], { signals: [], following: [], enrolled: [], ready: false }];
  const model = recommendPrograms(catalogue, { ...activity, chosen: chosen ?? [], userId: signed ? user!.id : undefined });
  const directory = await listPublicCreators("", [...new Set(model.ranked.map(r => courseCreatorId(r.course)))]);
  const creators = new Map(directory.creators.map(c => [c.id, c]));
  const items = model.ranked.map(r => ({ course: r.course, reason: r.reason, creator: creators.get(courseCreatorId(r.course)) ?? null }));
  return <DiscoverFeed items={items} userId={signed ? user!.id : undefined} following={activity.following} canDismiss={signed && activity.ready} followReady={directory.ready} />;
}
