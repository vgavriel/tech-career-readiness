import RoadmapBadgeAwards from "@/components/roadmap-badge-awards";
import { getRoadmapModules } from "@/lib/roadmap-modules";


/**
 * Render the Gold Stars overview for earned and in-progress milestones.
 */
export default async function GoldStarsPage() {
  const modules = await getRoadmapModules();

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <main
        id="main-content"
        tabIndex={-1}
        className="page-content mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 pb-20 pt-12 md:pt-16"
      >
        <section className="space-y-4">
          <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl">
            Gold Stars
          </h1>
          <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
            Earn gold stars by completing core lessons and optional extra credit.
            Track earned and in-progress milestones as you improve your readiness
            towards careers in Tech.
          </p>
        </section>

        <RoadmapBadgeAwards modules={modules} />
      </main>
    </div>
  );
}
