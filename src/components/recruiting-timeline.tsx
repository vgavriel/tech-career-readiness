"use client";

import { useState, useSyncExternalStore } from "react";

import LessonContent from "@/components/lesson-content";
import { pushLessonHash, useLessonHash } from "@/hooks/use-lesson-hash";
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
};

/**
 * A date-aware view of the lesson's Google Doc, inside the normal course shell.
 * The original guide is the server-rendered hydration baseline and is used for
 * source-heading links. The containing streamed course reader requires JavaScript.
 */
export default function RecruitingTimeline({ content, sourceHtml }: RecruitingTimelineProps) {
  const day = useSyncExternalStore(subscribeDay, readDay, emptySnapshot);
  const hash = useLessonHash();
  const [selection, setSelection] = useState<number | null>(null);
  const period = day ? getRecruitingPeriod(day) : null;
  const sourceHeading = content.sourceIds.includes(decodeHeading(hash));
  const showFull = !period || sourceHeading;
  const selected = selection ?? period?.index ?? 0;
  const season = RECRUITING_SEASONS[selected];
  const section = content.seasons[selected];
  const isCurrent = selected === period?.index;

  const selectSeason = (index: number | null) => {
    setSelection(index);
    // Keep the heading entry in history; returning to it must restore the guide.
    if (sourceHeading) pushLessonHash("");
  };

  return (
    <div className={styles.root} data-testid="recruiting-timeline">
      {period ? (
        <>
          <div className={styles.intro}>
            <div>
              <p className={styles.eyebrow}>Your recruiting year</p>
              <h2>Find your next move.</h2>
              {!showFull && content.introHtml ? (
                <div
                  className={`lesson-content ${styles.rich}`}
                  data-testid="recruiting-introduction"
                  dangerouslySetInnerHTML={{ __html: content.introHtml }}
                />
              ) : null}
            </div>
            <div className={styles.today}>
              <span>Today</span>
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
                aria-label={`${item.shortMonths} ${item.name}${index === period.index ? " · You are here" : ""}`}
                aria-pressed={!showFull && index === selected}
                aria-current={index === period.index ? "date" : undefined}
                aria-controls="recruiting-season-panel"
                onClick={() => selectSeason(index)}
              >
                <span className={styles.months}>{item.shortMonths}</span>
                <strong>{item.name}</strong>
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
                <button type="button" onClick={() => selectSeason(null)}>
                  Back to now
                </button>
              ) : null}
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
      </footer>
    </div>
  );
}
