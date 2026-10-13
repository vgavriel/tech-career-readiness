import { parseHTML } from "linkedom";

import { RECRUITING_SEASONS } from "@/lib/recruiting-seasons";

/** Sanitized, link-rewritten Google Doc sections for the interactive reader. */
export type RecruitingTimelineContent = {
  seasons: Array<{ headingId: string; overviewHtml: string; actionsHtml: string; tipHtml: string }>;
  resourcesHtml: string;
  sourceIds: string[];
};

const normalize = (text: string | null) =>
  (text ?? "").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
const isHeading = (element: Element) => /^H[1-6]$/.test(element.tagName);
const meaningful = (elements: Element[]) =>
  elements.some((element) => normalize(element.textContent));

/**
 * Enhance only the known six-season document structure. The caller falls back
 * to the complete lesson on schema drift. This must receive HTML that has
 * already passed the lesson sanitizer and internal-link rewriter; it is not a
 * sanitizer and never fetches content or substitutes a separate copy of advice.
 */
export function parseRecruitingTimeline(html: string): RecruitingTimelineContent | null {
  const { document } = parseHTML(`<html><body>${html}</body></html>`);
  const root = document.querySelector(".doc-content") ?? document.body;
  const blocks = Array.from(root.children);
  const headings = blocks.filter(isHeading);
  const seasonHeadings = RECRUITING_SEASONS.map(({ name, months }) => {
    const expected = normalize(`${name} (${months})`);
    const matches = headings.filter((heading) => normalize(heading.textContent) === expected);
    return matches.length === 1 ? matches[0] : null;
  });
  const resources = headings.filter(
    (heading) => normalize(heading.textContent) === "essential brown resources"
  );
  if (seasonHeadings.some((heading) => !heading) || resources.length !== 1) return null;
  const indexes = [...seasonHeadings, resources[0]].map((heading) => blocks.indexOf(heading!));
  if (indexes.some((index, i) => i > 0 && index <= indexes[i - 1])) return null;

  // Normalize presentation levels while retaining every source ID and link.
  const serialize = (elements: Element[]) =>
    elements
      .filter(
        (element) => normalize(element.textContent) || element.querySelector("img,video,iframe")
      )
      .map((element) => {
        if (!isHeading(element)) return element.outerHTML;
        const copy = document.createElement("h3");
        for (const attribute of Array.from(element.attributes))
          copy.setAttribute(attribute.name, attribute.value);
        copy.innerHTML = element.innerHTML;
        return copy.outerHTML;
      })
      .join("");

  const seasons: RecruitingTimelineContent["seasons"] = [];
  for (let index = 0; index < RECRUITING_SEASONS.length; index += 1) {
    const section = blocks.slice(indexes[index] + 1, indexes[index + 1]);
    const overview = section.findIndex(
      (element) =>
        isHeading(element) && /^what[’']s happening\??$/.test(normalize(element.textContent))
    );
    const actions = section.findIndex(
      (element) => isHeading(element) && /^action items:?$/.test(normalize(element.textContent))
    );
    const tip = section.findIndex((element) =>
      /^recruiting tip:/.test(normalize(element.textContent))
    );
    if (
      overview < 0 ||
      actions <= overview ||
      tip <= actions ||
      meaningful(section.slice(0, overview)) ||
      !meaningful(section.slice(overview + 1, actions)) ||
      !meaningful(section.slice(actions + 1, tip))
    )
      return null;
    seasons.push({
      headingId: seasonHeadings[index]!.id || `recruiting-season-${index}`,
      overviewHtml: serialize(section.slice(overview, actions)),
      actionsHtml: serialize(section.slice(actions, tip)),
      tipHtml: serialize(section.slice(tip)),
    });
  }
  const resourceBlocks = blocks.slice(indexes[6]);
  if (!meaningful(resourceBlocks.slice(1))) return null;
  return {
    seasons,
    resourcesHtml: serialize(resourceBlocks),
    sourceIds: Array.from(root.querySelectorAll("[id]")).map((element) => element.id),
  };
}
