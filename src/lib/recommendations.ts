import { contentAffinity } from "./content-affinity";
import { CATEGORIES, type Category, type Course } from "./types";

export type SignalKind =
  | "view"
  | "trailer"
  | "search"
  | "creator"
  | "enroll"
  | "dismiss";
export type InterestSignal = { courseId: string; kind: SignalKind; at: string };
export type RecommendationInput = {
  chosen: string[];
  signals: InterestSignal[];
  following: string[];
  enrolled: string[];
  userId?: string;
  now?: number;
};
export type TopicInterest = {
  category: Category;
  score: number;
  chosen: boolean;
  sources: string[];
};
export type Recommendation = {
  course: Course;
  score: number;
  reason: string;
  exploration?: boolean;
};
const DAY = 86_400_000;
const weights: Record<SignalKind, number> = {
  view: 0.7,
  trailer: 2.8,
  search: 1.6,
  creator: 1,
  enroll: 4,
  dismiss: 0,
};
const labels: Record<SignalKind, string> = {
  view: "Programas que abriste",
  trailer: "Trailers que viste",
  search: "Temas de tus búsquedas",
  creator: "Creadores que visitaste",
  enroll: "Programas a los que te uniste",
  dismiss: "",
};
const bounded = (value: number, scale: number) =>
  scale * (1 - Math.exp(-value / scale));

/** Modelo determinista y explicable: señales acotadas, recencia y exploración. */
export function recommendPrograms(
  catalogue: Course[],
  input: RecommendationInput,
) {
  const now = input.now ?? Date.now();
  const courses = [
    ...new Map(
      catalogue.filter((c) => c.published).map((c) => [c.id, c]),
    ).values(),
  ];
  const byId = new Map(courses.map((c) => [c.id, c]));
  const followed = new Set(input.following),
    enrolled = new Set(input.enrolled);
  const topics = new Map<
    Category,
    { raw: number; sources: Set<string>; chosen: boolean }
  >();
  for (const category of CATEGORIES)
    topics.set(category, {
      raw: 0,
      sources: new Set(),
      chosen: input.chosen.includes(category),
    });
  const latest = new Map<string, InterestSignal>();
  for (const s of input.signals) {
    if (!byId.has(s.courseId) || !Object.hasOwn(weights, s.kind)) continue;
    const age = (now - Date.parse(s.at)) / DAY;
    if (
      !Number.isFinite(age) ||
      age < -1 / 24 ||
      age > (s.kind === "dismiss" ? 180 : 90)
    )
      continue;
    const key = `${s.courseId}:${s.kind}`,
      old = latest.get(key);
    if (!old || Date.parse(old.at) < Date.parse(s.at)) latest.set(key, s);
  }
  const dismissed = new Set(
    [...latest.values()]
      .filter((s) => s.kind === "dismiss")
      .map((s) => s.courseId),
  );
  const evidence = new Map<string, { value: number; reason: string }>();
  const creatorAffinity = new Map<string, number>();
  for (const signal of latest.values()) {
    if (signal.kind === "dismiss") continue;
    const course = byId.get(signal.courseId)!;
    if (course.creatorId === input.userId && input.userId) continue;
    const age = Math.max(0, (now - Date.parse(signal.at)) / DAY);
    const value = weights[signal.kind] * Math.pow(0.5, age / 21);
    const prev = evidence.get(course.id);
    // Ver, abrir y buscar el mismo programa no se suman como tres gustos distintos.
    if (!prev || prev.value < value)
      evidence.set(course.id, { value, reason: labels[signal.kind] });
  }
  for (const [id, e] of evidence) {
    const c = byId.get(id)!,
      topic = topics.get(c.category)!;
    topic.raw += e.value;
    topic.sources.add(e.reason);
    if (c.creatorId)
      creatorAffinity.set(
        c.creatorId,
        (creatorAffinity.get(c.creatorId) ?? 0) + e.value,
      );
  }
  for (const category of CATEGORIES) {
    if (
      courses.some(
        (c) =>
          c.category === category && c.creatorId && followed.has(c.creatorId),
      )
    ) {
      topics.get(category)!.raw += 3;
      topics.get(category)!.sources.add("Creadores que sigues");
    }
  }
  const interests: TopicInterest[] = CATEGORIES.map((category) => {
    const t = topics.get(category)!;
    return {
      category,
      score: (t.chosen ? 3 : 0) + bounded(t.raw, 6),
      chosen: t.chosen,
      sources: [...t.sources],
    };
  })
    .filter((t) => t.score > 0.15)
    .sort(
      (a, b) => b.score - a.score || a.category.localeCompare(b.category, "es"),
    );
  const affinity = new Map(interests.map((t) => [t.category, t.score]));
  const candidates = courses.filter(
    (c) =>
      !enrolled.has(c.id) &&
      !dismissed.has(c.id) &&
      (!input.userId || c.creatorId !== input.userId),
  );
  const similarity = contentAffinity(courses);
  const contentEvidence = [...evidence.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 50);
  const seenIds = new Set(
    [...latest.values()]
      .filter((s) => s.kind === "view" || s.kind === "trailer")
      .map((s) => s.courseId),
  );
  const searchedIds = new Set(
    [...latest.values()]
      .filter((s) => s.kind === "search")
      .map((s) => s.courseId),
  );
  const base = candidates
    .map((course) => {
      const topic = interests.find((t) => t.category === course.category);
      const follows = Boolean(
        course.creatorId && followed.has(course.creatorId),
      );
      const creator = course.creatorId
        ? bounded(creatorAffinity.get(course.creatorId) ?? 0, 3)
        : 0;
      const seen = seenIds.has(course.id);
      const related = bounded(
        contentEvidence.reduce(
          (sum, [id, e]) =>
            id === course.id ? sum : sum + similarity(course.id, id) * e.value,
          0,
        ),
        3,
      );
      const searched = searchedIds.has(course.id) ? 0.8 : 0;
      const age = course.createdAt
        ? (now - Date.parse(course.createdAt)) / DAY
        : Infinity;
      const freshness =
        Number.isFinite(age) && age >= 0 ? 0.8 * Math.pow(0.5, age / 14) : 0;
      const score =
        (topic?.score ?? 0) * 2 +
        (follows ? 8 : 0) +
        creator +
        (seen ? -0.8 : 0) +
        related * 2 +
        searched +
        Math.min(0.6, Math.log1p(Math.max(0, course.members)) * 0.08) +
        freshness;
      const reason = follows
        ? "De un creador que sigues"
        : related > 0.4
          ? "Relacionado con programas que exploraste"
          : searched
            ? "Relacionado con tus búsquedas de programas"
            : topic?.sources.length
              ? `Por tu actividad en ${course.category}`
              : topic?.chosen
                ? `Elegiste ${course.category}`
                : "Para descubrir algo nuevo";
      return { course, score, reason };
    })
    .sort(
      (a, b) => b.score - a.score || a.course.id.localeCompare(b.course.id),
    );
  const ranked: Recommendation[] = [],
    remaining = [...base];
  const creatorCounts = new Map<string, number>(),
    categoryCounts = new Map<Category, number>();
  while (remaining.length && ranked.length < 60) {
    const exploration =
      interests.length > 0 && (ranked.length === 3 || ranked.length === 7);
    let pool = remaining.filter(
      (r) =>
        ranked.length >= 8 ||
        ((creatorCounts.get(r.course.creatorId ?? r.course.creatorName) ?? 0) <
          2 &&
          (categoryCounts.get(r.course.category) ?? 0) < 3),
    );
    if (!pool.length) pool = remaining;
    const novel = exploration
      ? pool.filter(
          (r) => !affinity.has(r.course.category) && !evidence.has(r.course.id),
        )
      : [];
    const chosen = novel[0] ?? pool[0];
    ranked.push(
      novel.length
        ? { ...chosen, reason: "Para descubrir otro tema", exploration: true }
        : chosen,
    );
    remaining.splice(remaining.indexOf(chosen), 1);
    const creator = chosen.course.creatorId ?? chosen.course.creatorName;
    creatorCounts.set(creator, (creatorCounts.get(creator) ?? 0) + 1);
    categoryCounts.set(
      chosen.course.category,
      (categoryCounts.get(chosen.course.category) ?? 0) + 1,
    );
  }
  return {
    ranked,
    interests,
    dismissed: [...dismissed],
    hasPersonalization: interests.length > 0 || followed.size > 0,
  };
}
