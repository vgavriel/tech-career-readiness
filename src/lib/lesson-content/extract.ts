import { JSDOM, VirtualConsole } from "jsdom";

import { applyDocClassStyles } from "@/lib/lesson-content/doc-styles";
import { applyBackgroundImages } from "@/lib/lesson-content/images";
import { extractStyleMaps } from "@/lib/lesson-content/style-maps";

const GOOGLE_DOCS_BANNER_PHRASES = [
  "Published using Google Docs",
  "Report abuse",
  "Updated automatically every 5 minutes",
];

const normalizeBannerText = (text: string) => text.replace(/\\s+/g, " ").trim();
const normalizeContentText = (text: string) => normalizeBannerText(text).toLowerCase();

const LESSON_FOOTER_PHRASES = ["questions? reach out", "author:", "last updated"];

const hasMeaningfulText = (text: string | null | undefined) =>
  normalizeBannerText(text ?? "") !== "";

const removeEmptyHeadings = (root: Element) => {
  for (const heading of Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6"))) {
    if (!hasMeaningfulText(heading.textContent)) {
      heading.remove();
    }
  }
};

const normalizeHeadingLevels = (root: Element) => {
  const headings = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  let currentLevel = 1;

  for (const heading of headings) {
    const level = Number.parseInt(heading.tagName.slice(1), 10);
    if (!Number.isFinite(level)) {
      continue;
    }

    const targetLevel = Math.min(level, currentLevel + 1);
    if (targetLevel !== level) {
      const replacement = root.ownerDocument?.createElement(`h${targetLevel}`);
      if (replacement) {
        for (const attribute of Array.from(heading.attributes)) {
          replacement.setAttribute(attribute.name, attribute.value);
        }
        while (heading.firstChild) {
          replacement.appendChild(heading.firstChild);
        }
        heading.replaceWith(replacement);
      }
    }

    currentLevel = targetLevel;
  }
};

const boldenPrimaryHeadings = (root: Element) => {
  for (const heading of Array.from(root.querySelectorAll("h1"))) {
    heading.classList.add("doc-bold");
  }
};

const stripEmptyAnchors = (root: Element) => {
  for (const anchor of Array.from(root.querySelectorAll("a"))) {
    if (anchor.hasAttribute("id") || anchor.hasAttribute("name")) {
      continue;
    }

    const hasText = hasMeaningfulText(anchor.textContent);
    const hasMedia = Boolean(anchor.querySelector("img, svg"));
    if (!hasText && !hasMedia) {
      anchor.remove();
    }
  }
};

const stripGoogleDocsBanner = (root: Element) => {
  for (const element of Array.from(root.querySelectorAll("*"))) {
    const text = normalizeBannerText(element.textContent ?? "");
    if (text && GOOGLE_DOCS_BANNER_PHRASES.some((phrase) => text.includes(phrase))) {
      element.remove();
    }
  }

  const children = Array.from(root.children);
  if (children.length >= 2) {
    const firstText = normalizeBannerText(children[0].textContent ?? "");
    const secondText = normalizeBannerText(children[1].textContent ?? "");
    if (firstText && firstText === secondText) {
      children[0].remove();
    }
  }
};

const isDividerElement = (element: Element) => {
  if (element.tagName === "HR") {
    return true;
  }

  const text = normalizeBannerText(element.textContent ?? "");
  if (!text) {
    return false;
  }

  const stripped = text.replace(/[\\s\\-–—_•·.]+/g, "");
  return stripped.length === 0;
};

const stripLessonFooter = (root: Element) => {
  const blocks = Array.from(root.querySelectorAll("p, li, hr"));
  if (blocks.length === 0) {
    return;
  }

  const tailStartIndex = Math.max(0, blocks.length - 12);
  const footerStart = blocks
    .map((block, index) => {
      const text = normalizeContentText(block.textContent ?? "");
      if (
        index >= tailStartIndex &&
        text &&
        LESSON_FOOTER_PHRASES.some((phrase) => text.includes(phrase))
      ) {
        return block;
      }
      return null;
    })
    .filter((block): block is Element => block !== null)[0];

  if (!footerStart) {
    return;
  }

  let start = footerStart;
  while (start.previousElementSibling) {
    const previous = start.previousElementSibling;
    if (isDividerElement(previous) || !hasMeaningfulText(previous.textContent)) {
      start = previous;
      continue;
    }
    break;
  }

  const parent = start.parentElement;
  if (!parent) {
    return;
  }

  let current: Element | null = start;
  while (current) {
    const nextSibling: Element | null = current.nextElementSibling;
    current.remove();
    current = nextSibling;
  }

  let cleanup: Element | null = parent;
  while (cleanup && cleanup !== root) {
    if (hasMeaningfulText(cleanup.textContent)) {
      break;
    }
    const nextParent: Element | null = cleanup.parentElement;
    cleanup.remove();
    cleanup = nextParent;
  }
};

const stripHorizontalRules = (root: Element) => {
  for (const rule of Array.from(root.querySelectorAll("hr"))) {
    rule.remove();
  }
};

const trimLeadingWhitespaceNodes = (element: Element) => {
  let node: ChildNode | null = element.firstChild;
  while (node) {
    const next = node.nextSibling;
    if (node.nodeType === 3) {
      if (!hasMeaningfulText(node.textContent)) {
        node.remove();
        node = next;
        continue;
      }
      break;
    }

    if (node.nodeType === 1) {
      const child = node as Element;
      if (child.tagName === "BR") {
        child.remove();
        node = next;
        continue;
      }
      const hasMedia = Boolean(child.querySelector("img, svg, video, iframe"));
      if (!hasMeaningfulText(child.textContent) && !hasMedia) {
        child.remove();
        node = next;
        continue;
      }
      break;
    }

    break;
  }
};

const trimTableCellWhitespace = (root: Element) => {
  for (const cell of Array.from(root.querySelectorAll("td, th"))) {
    trimLeadingWhitespaceNodes(cell);
  }
};

const findLessonTitleElement = (root: Element) => {
  const titleCandidate = root.querySelector(".doc-title, .title");
  if (titleCandidate && normalizeBannerText(titleCandidate.textContent ?? "")) {
    return titleCandidate;
  }

  const firstChild = Array.from(root.children).find((child) =>
    normalizeBannerText(child.textContent ?? "")
  );
  if (firstChild?.tagName === "H1") {
    return firstChild;
  }

  return null;
};

const removeLessonTitle = (root: Element) => {
  const titleElement = findLessonTitleElement(root);
  if (!titleElement) {
    return;
  }

  const parent = titleElement.parentElement;
  titleElement.remove();

  if (parent && parent !== root && normalizeBannerText(parent.textContent ?? "") === "") {
    parent.remove();
  }
};

const stripStyleNodes = (styleNodes: HTMLStyleElement[]) => {
  for (const node of styleNodes) {
    node.remove();
  }
};

export const extractLessonHtml = (rawHtml: string) => {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(rawHtml, { virtualConsole });
  const document = dom.window.document;
  const { classStyleMap, backgroundImageMap, styleNodes } = extractStyleMaps(document);

  const contentRoot =
    document.querySelector("#contents") ?? document.querySelector(".doc-content") ?? document.body;

  if (!contentRoot) {
    return rawHtml;
  }

  removeLessonTitle(contentRoot);
  stripGoogleDocsBanner(contentRoot);
  stripLessonFooter(contentRoot);
  stripHorizontalRules(contentRoot);
  trimTableCellWhitespace(contentRoot);
  applyDocClassStyles(contentRoot, classStyleMap);
  applyBackgroundImages(contentRoot, backgroundImageMap);
  stripStyleNodes(styleNodes);
  stripEmptyAnchors(contentRoot);
  removeEmptyHeadings(contentRoot);
  normalizeHeadingLevels(contentRoot);
  boldenPrimaryHeadings(contentRoot);

  return contentRoot.innerHTML;
};
