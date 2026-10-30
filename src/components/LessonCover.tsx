import { Stage } from "./Stage";
import { defaultArt } from "@/lib/art";
import { withCover } from "@/lib/covers";
import type { ArtConfig, Lesson } from "@/lib/types";

export function LessonCover({
  lesson,
  art,
}: {
  lesson: Pick<Lesson, "id" | "title" | "cover">;
  art?: ArtConfig;
}) {
  return (
    <div className="lz-thumb">
      <Stage
        course={{
          id: lesson.id,
          art: withCover(
            art ?? defaultArt(lesson.title, "Oficios", lesson.id),
            lesson.title,
            lesson.cover,
          ),
          trailerSource: "creator",
        }}
        badges={false}
      />
    </div>
  );
}
