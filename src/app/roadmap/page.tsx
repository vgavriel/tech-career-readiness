import { redirect } from "next/navigation";

import { getRoadmapModules } from "@/lib/roadmap-modules";

/**
 * Redirect legacy roadmap visits to the first lesson.
 */
export default async function RoadmapPage() {
  const modules = await getRoadmapModules();
  const firstLesson = modules[0]?.lessons[0]?.slug ?? null;
  if (!firstLesson) {
    redirect("/");
  }

  redirect(`/lesson/${firstLesson}`);
}
