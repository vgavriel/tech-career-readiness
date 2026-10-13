import { parseHTML } from "linkedom";

import { RECRUITING_SEASONS } from "@/lib/recruiting-seasons";

/** Sanitized, link-rewritten Google Doc sections for the interactive reader. */
export type RecruitingTimelineContent = {
  introHtml: string;
  seasons: Array<{ overviewHtml: string; actionsHtml: string; tipHtml: string }>;
  resourcesHtml: string;
  sourceIds: string[];
};

const normalize = (text: string | null) =>
  (text ?? "").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
const isHeading = (element: Element) => /^H[1-6]$/.test(element.tagName);
const mediaSelector = "img,svg,video,audio,iframe,hr,table";
const hasMedia = (element: Element) =>
  element.matches(mediaSelector) || Boolean(element.querySelector(mediaSelector));
const hasContent = (element: Element) =>
  Boolean(normalize(element.textContent)) || hasMedia(element);
const meaningful = (elements: Element[]) => elements.some(hasContent);
const hasUnwrappedText = (element: Element) =>
  Array.from(element.childNodes).some((node) => node.nodeType === 3 && normalize(node.textContent));

/**
 * Enhance only the known six-season document structure. The caller falls back
 * to the complete lesson on schema drift. This must receive HTML that has
 * already passed the lesson sanitizer and internal-link rewriter; it is not a
 * sanitizer and never fetches content or substitutes a separate copy of advice.
 */
export function parseRecruitingTimeline(html: string): RecruitingTimelineContent | null {
  const { document } = parseHTML(`<html><body>${html}</body></html>`);
  const root = document.querySelector(".doc-content") ?? document.body;
  // Do not silently ignore text or a second content block outside the parsed wrapper.
  if (
    hasUnwrappedText(root) ||
    (root !== document.body &&
      (hasUnwrappedText(document.body) ||
        Array.from(document.body.children).some(
          (element) => element !== root && hasContent(element)
        )))
  )
    return null;
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

  // Keep substantive blocks, including standalone media; omit only empty spacers.
  const serialize = (elements: Element[]) =>
    elements
      .filter(hasContent)
      .map((element) => {
        if (!isHeading(element)) return element.outerHTML;
        const copy = document.createElement("h3");
        for (const attribute of Array.from(element.attributes))
          copy.setAttribute(attribute.name, attribute.value);
        copy.innerHTML = element.innerHTML;
        return copy.outerHTML;
      })
      .join("");

  // The calendar replaces only the known title and jump-list scaffolding.
  // Every other pre-season block is source introduction content, including edits.
  const sourceHeadings = [...seasonHeadings, resources[0]] as Element[];
  const isIntroScaffolding = (element: Element) => {
    if (element.tagName !== "P" || hasMedia(element)) return false;
    const text = normalize(element.textContent);
    const links = Array.from(element.querySelectorAll("a"));
    if (links.length === 0) {
      return [
        normalize("The Tech Recruiting Timeline: A Brown Student’s Guide"),
        normalize("Click to jump to a particular time of year:"),
      ].includes(text);
    }
    if (links.length !== 1 || normalize(links[0].textContent) !== text) return false;
    return sourceHeadings.some(
      (heading) =>
        heading.id &&
        links[0].getAttribute("href") === `#${heading.id}` &&
        text === normalize(heading.textContent)
    );
  };
  const introHtml = serialize(
    blocks.slice(0, indexes[0]).filter((element) => !isIntroScaffolding(element))
  );

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
      overviewHtml: serialize(section.slice(overview, actions)),
      actionsHtml: serialize(section.slice(actions, tip)),
      tipHtml: serialize(section.slice(tip)),
    });
  }
  const resourceBlocks = blocks.slice(indexes[6]);
  if (!meaningful(resourceBlocks.slice(1))) return null;
  return {
    introHtml,
    seasons,
    resourcesHtml: serialize(resourceBlocks),
    sourceIds: Array.from(root.querySelectorAll("[id]")).map((element) => element.id),
  };
}
