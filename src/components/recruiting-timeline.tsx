"use client";

import { useState, useSyncExternalStore } from "react";

import LessonContent from "@/components/lesson-content";
import {
  getRecruitingDay,
  getRecruitingPeriod,
  RECRUITING_SEASONS,
} from "@/lib/recruiting-seasons";
import type { RecruitingTimelineContent } from "@/lib/recruiting-timeline";

import styles from "./recruiting-timeline.module.css";

/** Subscribe to day changes without a hydration-dependent initial render. */
const subscribeDay = (notify: () => void) => {
  const timer = window.setInterval(notify, 60_000);
  document.addEventListener("visibilitychange", notify);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", notify);
  };
};
const subscribeHash = (notify: () => void) => {
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);
  return () => {
    window.removeEventListener("hashchange", notify);
    window.removeEventListener("popstate", notify);
  };
};
const readHash = () => window.location.hash;
const emptySnapshot = () => "";
const readDay = () => getRecruitingDay();

const decodeHeading = (hash: string) => {
  try {
    const value = decodeURIComponent(hash.slice(1));
    return new URLSearchParams(value).get("heading") ?? value;
  } catch {
    return hash.slice(1);
  }
};

type RecruitingTimelineProps = {
  content: RecruitingTimelineContent;
  sourceHtml: string;
  sourceUrl: string;
};

/**
 * A date-aware view of the lesson's Google Doc, inside the normal course shell.
 * The original guide is server-rendered, remains usable without JavaScript,
 * and is used for incoming source-heading links to preserve reader navigation.
 */
export default function RecruitingTimeline({
  content,
  sourceHtml,
  sourceUrl,
}: RecruitingTimelineProps) {
  const day = useSyncExternalStore(subscribeDay, readDay, emptySnapshot);
  const hash = useSyncExternalStore(subscribeHash, readHash, emptySnapshot);
  const [selection, setSelection] = useState<{
    index: number | null;
    full: boolean;
    hash: string;
  } | null>(null);
  const period = day ? getRecruitingPeriod(day) : null;
  const sourceHeading = content.sourceIds.includes(decodeHeading(hash));
  const activeSelection = selection?.hash === hash ? selection : null;
  const showFull = !period || (activeSelection?.full ?? sourceHeading);
  const selected = activeSelection?.index ?? period?.index ?? 0;
  const season = RECRUITING_SEASONS[selected];
  const section = content.seasons[selected];
  const isCurrent = selected === period?.index;

  return (
    <div className={styles.root} data-testid="recruiting-timeline">
      {period ? (
        <>
          <div className={styles.intro}>
            <div>
              <p className={styles.eyebrow}>Your recruiting year</p>
              <h2>Find your next move.</h2>
              <p>See what’s happening this season, then explore the year ahead.</p>
            </div>
            <div className={styles.today}>
              <span>Today at Brown</span>
              <time dateTime={day}>{period.dateLabel}</time>
            </div>
          </div>
          <div className={styles.yearLabel}>
            <span>{period.cycle}</span>
            <span>Select a season</span>
          </div>
          <nav className={styles.seasons} aria-label="Recruiting seasons">
            {RECRUITING_SEASONS.map((item, index) => (
              <button
                key={item.name}
                type="button"
                aria-label={`${item.shortMonths} ${item.name} ${item.focus}${index === period.index ? " · You are here" : ""}`}
                aria-pressed={!showFull && index === selected}
                aria-current={index === period.index ? "date" : undefined}
                aria-controls="recruiting-season-panel"
                onClick={() => setSelection({ index, full: false, hash })}
              >
                <span className={styles.months}>{item.shortMonths}</span>
                <strong>{item.name}</strong>
                <span className={styles.focus}>{item.focus}</span>
                <span className={styles.current}>
                  {index === period.index ? "● You are here" : ""}
                </span>
              </button>
            ))}
          </nav>
          <div className={styles.toolbar}>
            <p className={styles.status} role="status" aria-live="polite">
              {showFull
                ? "The complete recruiting guide"
                : `${isCurrent ? "Happening now" : "Exploring"} · ${season.name}`}
            </p>
            <div className={styles.controls}>
              {showFull || !isCurrent ? (
                <button
                  type="button"
                  onClick={() => setSelection({ index: null, full: false, hash })}
                >
                  Back to now
                </button>
              ) : null}
              <button
                type="button"
                aria-expanded={showFull}
                aria-controls="recruiting-season-panel"
                onClick={() =>
                  setSelection({ index: showFull ? null : selected, full: !showFull, hash })
                }
              >
                {showFull ? "Interactive view" : "Read full guide"}
              </button>
            </div>
          </div>
        </>
      ) : null}
      <div id="recruiting-season-panel">
        {showFull ? (
          <LessonContent html={sourceHtml} />
        ) : (
          <>
            <section aria-labelledby="recruiting-season-title" className={styles.panel}>
              <header className={styles.panelHeader}>
                <h2 id="recruiting-season-title">{season.name}</h2>
                <span>{season.months}</span>
              </header>
              <div className={styles.columns}>
                <div
                  className={`lesson-content ${styles.rich}`}
                  dangerouslySetInnerHTML={{ __html: section.overviewHtml }}
                />
                <div
                  className={`lesson-content ${styles.rich} ${styles.actions}`}
                  dangerouslySetInnerHTML={{ __html: section.actionsHtml }}
                />
              </div>
              <div
                className={`lesson-content ${styles.rich} ${styles.tip}`}
                dangerouslySetInnerHTML={{ __html: section.tipHtml }}
              />
            </section>
            <aside
              className={`lesson-content ${styles.rich} ${styles.resources}`}
              aria-label="Essential Brown resources"
              dangerouslySetInnerHTML={{ __html: content.resourcesHtml }}
            />
          </>
        )}
      </div>
      <footer className={styles.footer}>
        <p>
          Recruiting timing varies by employer and role. Check individual postings for current
          deadlines.
        </p>
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
          Open source Google Doc <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </div>
  );
}
