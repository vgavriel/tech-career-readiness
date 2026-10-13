import { readFileSync } from "node:fs";
import path from "node:path";

import { parseHTML } from "linkedom";

export const recruitingPath = "/lesson/tech-recruiting-timeline";
export const recruitingNotice =
  "Fixture guidance: international students should check program deadlines.";
export const recruitingImageUrl = "https://lh3.googleusercontent.com/recruiting-fixture.svg";
export const recruitingHeadingIds = { winter: "h.8tyi8dh7ov0i", spring: "h.uh2fioqej0ne" } as const;

// Start with the real sanitized document, then model two ordinary editorial additions.
const source = readFileSync(
  path.resolve("src/lib/__tests__/fixtures/recruiting-timeline.html"),
  "utf8"
);
const { document } = parseHTML(`<html><body>${source}</body></html>`);
const notice = document.createElement("p");
notice.textContent = recruitingNotice;
document.getElementById("h.e0nhqe6dcyfl")!.before(notice);
const image = document.createElement("img");
image.setAttribute("src", recruitingImageUrl);
image.setAttribute("alt", "Recruiting fixture checklist");
image.setAttribute("width", "160");
image.setAttribute("height", "80");
document.getElementById("h.gwgy716nup2l")!.after(image);
export const recruitingFixtureHtml = document.body.innerHTML;
