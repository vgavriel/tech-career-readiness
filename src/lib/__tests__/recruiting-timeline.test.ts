import { readFileSync } from "node:fs";
import path from "node:path";

import { parseHTML } from "linkedom";
import { describe, expect, it } from "vitest";

import { getRecruitingDay, getRecruitingPeriod } from "@/lib/recruiting-seasons";
import { parseRecruitingTimeline } from "@/lib/recruiting-timeline";

const html = readFileSync(
  path.resolve("src/lib/__tests__/fixtures/recruiting-timeline.html"),
  "utf8"
);

describe("recruiting calendar", () => {
  it.each([
    [1, 3],
    [2, 3],
    [3, 4],
    [4, 4],
    [5, 5],
    [6, 5],
    [7, 0],
    [8, 0],
    [9, 1],
    [10, 1],
    [11, 2],
    [12, 2],
  ])("places month %i in season %i", (month, index) => {
    expect(getRecruitingPeriod(`2026-${String(month).padStart(2, "0")}-15`).index).toBe(index);
  });
  it("uses Brown's date at the UTC month boundary and rolls over the cycle in July", () => {
    expect(getRecruitingDay(new Date("2026-07-01T03:59:59Z"))).toBe("2026-06-30");
    expect(getRecruitingDay(new Date("2026-07-01T04:00:00Z"))).toBe("2026-07-01");
    expect(getRecruitingPeriod("2026-06-30").cycle).toBe("July 2025 – June 2026");
    expect(getRecruitingPeriod("2026-07-01").cycle).toBe("July 2026 – June 2027");
    expect(getRecruitingDay(new Date("2027-01-01T04:59:59Z"))).toBe("2026-12-31");
    expect(getRecruitingPeriod("2027-01-01").cycle).toBe("July 2026 – June 2027");
  });
});

describe("Google Doc recruiting timeline parser", () => {
  it("keeps every seasonal list item, tip, resource, and rewritten link from the current document", () => {
    const parsed = parseRecruitingTimeline(html);
    expect(parsed).not.toBeNull();
    expect(parsed!.seasons).toHaveLength(6);
    const combined =
      parsed!.seasons.map((s) => s.overviewHtml + s.actionsHtml + s.tipHtml).join("") +
      parsed!.resourcesHtml;
    const original = parseHTML(`<html><body>${html}</body></html>`).document;
    const enhanced = parseHTML(`<html><body>${combined}</body></html>`).document;
    const text = (el: Element) => el.textContent?.replace(/\s+/g, " ").trim();
    expect(Array.from(enhanced.querySelectorAll("li"), text)).toEqual(
      Array.from(original.querySelectorAll("li"), text)
    );
    const links = (doc: Document) =>
      Array.from(doc.querySelectorAll("a[href]"))
        .map((a) => a.getAttribute("href"))
        .filter((href) => !href?.startsWith("#"));
    expect(links(enhanced)).toEqual(links(original));
    expect(combined).toContain("Coding assessments are a window");
    expect(combined).toContain("/lesson/ace-interview-prep-timeline");
    expect(parsed!.sourceIds).toContain("h.3n5kzvc32gkr");
    expect(parsed!.seasons[1].actionsHtml).not.toContain("<h1");
  });
  it("picks up editorial changes from the source instead of using hardcoded advice", () => {
    const updated = html.replace(
      "By mid-August, big-tech applications open widely.",
      "Updated guidance for this year's recruiting."
    );
    expect(parseRecruitingTimeline(updated)!.seasons[0].overviewHtml).toContain("Updated guidance");
  });
  it.each([
    html.replace(/Late Summer \(July–August\)/g, "Summer (June–August)"),
    html.replace(/Action Items:?/g, "How to prepare"),
    html.replace(/Essential Brown Resources/g, "Resources"),
    html + "<h1>Late Summer (July–August)</h1>",
    "<p>Unstructured content</p>",
  ])("fails safely when the document no longer has the required structure", (source) => {
    // Duplicate headings must be in the content wrapper, where the source lives.
    const adjusted = source.endsWith("<h1>Late Summer (July–August)</h1>")
      ? html.replace("</div><p", "</div><h1>Late Summer (July–August)</h1><p")
      : source;
    expect(parseRecruitingTimeline(adjusted)).toBeNull();
  });
});
