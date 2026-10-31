import Link from "next/link";
import { creatorPath, type Creator } from "@/lib/creators";
import { Avatar } from "./Avatar";

export function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <Link href={creatorPath(creator.id)} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-accent">
      <Avatar name={creator.name} src={creator.avatarUrl} className="h-12 w-12 text-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold group-hover:text-accent">{creator.name}</p>
        <p className="mt-1 text-xs text-muted">{creator.demo ? "Ejemplo · " : ""}{creator.programs} {creator.programs === 1 ? "programa publicado" : "programas publicados"}</p>
      </div>
      <span className="text-muted group-hover:text-accent" aria-hidden>↗</span>
    </Link>
  );
}
