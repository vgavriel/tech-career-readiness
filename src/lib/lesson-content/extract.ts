import { parseHTML } from "linkedom";

import { applyDocClassStyles } from "@/lib/lesson-content/doc-styles";
import { applyBackgroundImages, extractCssLengthValue } from "@/lib/lesson-content/images";
import { extractStyleMaps } from "@/lib/lesson-content/style-maps";

const GOOGLE_DOCS_BANNER_PHRASES = [
  "Published using Google Docs",
  "Report abuse",
  "Updated automatically every 5 minutes",
];

/**
 * Normalize banner text by collapsing whitespace.
 */
const normalizeBannerText = (text: string) => text.replace(/\\s+/g, " ").trim();
/**
 * Normalize content text for case-insensitive comparisons.
 */
const normalizeContentText = (text: string) => normalizeBannerText(text).toLowerCase();

const LESSON_FOOTER_PHRASES = ["questions? reach out", "author:", "last updated"];

/**
 * Test whether the text has any non-whitespace content.
 */
const hasMeaningfulText = (text: string | null | undefined) =>
  normalizeBannerText(text ?? "") !== "";

/**
 * Remove empty heading tags from the lesson content.
 */
const removeEmptyHeadings = (root: Element) => {
  for (const heading of Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6"))) {
    if (!hasMeaningfulText(heading.textContent)) {
      heading.remove();
    }
  }
};

/**
 * Normalize heading levels to avoid skipping directly to deep levels.
 */
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

/**
 * Apply a bold class to primary headings for consistent styling.
 */
const boldenPrimaryHeadings = (root: Element) => {
  for (const heading of Array.from(root.querySelectorAll("h1"))) {
    heading.classList.add("doc-bold");
  }
};

/**
 * Remove anchor tags that don't contribute content or navigation.
 */
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

/**
 * Remove standard Google Docs banner content and duplicates.
 */
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

/**
 * Identify HR-like divider elements (rules or punctuation-only text).
 */
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

/**
 * Strip the trailing lesson footer block when it matches known phrases.
 */
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

/**
 * Remove horizontal rules from the lesson content.
 */
const stripHorizontalRules = (root: Element) => {
  for (const rule of Array.from(root.querySelectorAll("hr"))) {
    rule.remove();
  }
};

const parseNumericAttribute = (value: string | null) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const extractImageSizeFromSrc = (src: string | null) => {
  if (!src) {
    return null;
  }
  const match = src.match(/=w(\d+)-h(\d+)/i);
  if (!match) {
    return null;
  }
  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }
  return { width, height };
};

const getImageDimensions = (img: Element) => {
  const widthAttr = parseNumericAttribute(img.getAttribute("width"));
  const heightAttr = parseNumericAttribute(img.getAttribute("height"));

  const style = img.getAttribute("style") ?? "";
  const widthStyle = extractCssLengthValue(style, "width");
  const heightStyle = extractCssLengthValue(style, "height");

  const width = widthAttr ?? widthStyle;
  const height = heightAttr ?? heightStyle;

  if (width && height) {
    return { width, height };
  }

  const fromSrc = extractImageSizeFromSrc(img.getAttribute("src"));
  if (fromSrc) {
    return fromSrc;
  }

  if (width || height) {
    return { width: width ?? 0, height: height ?? 0 };
  }

  return null;
};

const isBannerImage = (img: Element) => {
  const dimensions = getImageDimensions(img);
  if (!dimensions?.width || !dimensions?.height) {
    return false;
  }
  const ratio = dimensions.width / dimensions.height;
  return dimensions.width >= 520 && dimensions.height <= 280 && ratio >= 2;
};

const stripLeadingBannerImages = (root: Element) => {
  const orderedElements = Array.from(root.querySelectorAll("*"));
  const elementIndex = new Map<Element, number>();

  orderedElements.forEach((element, index) => {
    elementIndex.set(element, index);
  });

  const textBlockTags = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI"]);
  const firstTextBlock = orderedElements.find(
    (element) => textBlockTags.has(element.tagName) && hasMeaningfulText(element.textContent)
  );
  const firstTextIndex = firstTextBlock ? elementIndex.get(firstTextBlock) : undefined;

  const findImageBlock = (img: Element) => {
    let current: Element | null = img.parentElement;
    while (current && current !== root) {
      if (["P", "DIV", "FIGURE", "TABLE", "SECTION"].includes(current.tagName)) {
        return current;
      }
      current = current.parentElement;
    }
    return img.parentElement ?? img;
  };

  for (const element of orderedElements) {
    if (element.tagName !== "IMG") {
      continue;
    }

    if (!isBannerImage(element)) {
      continue;
    }

    const imageIndex = elementIndex.get(element);
    if (imageIndex === undefined) {
      continue;
    }

    if (firstTextIndex !== undefined && imageIndex > firstTextIndex) {
      continue;
    }

    const block = findImageBlock(element);
    if (!block) {
      continue;
    }

    if (hasMeaningfulText(block.textContent)) {
      continue;
    }

    const blockImages = Array.from(block.querySelectorAll("img"));
    if (!blockImages.some(isBannerImage)) {
      continue;
    }

    block.remove();
  }
};

/**
 * Trim leading whitespace-only text or empty nodes in an element.
 */
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

/**
 * Normalize whitespace inside table cells.
 */
const trimTableCellWhitespace = (root: Element) => {
  for (const cell of Array.from(root.querySelectorAll("td, th"))) {
    trimLeadingWhitespaceNodes(cell);
  }
};

/**
 * Find the element that contains the lesson title.
 */
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

/**
 * Remove the lesson title element and clean up empty wrappers.
 */
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

/**
 * Remove style nodes from the lesson HTML to prevent inline leakage.
 */
const stripStyleNodes = (styleNodes: HTMLStyleElement[]) => {
  for (const node of styleNodes) {
    node.remove();
  }
};

/**
 * Extract and normalize lesson HTML from raw Google Docs output.
 *
 * Removes Google Docs banners/footers, normalizes headings, trims table
 * whitespace, and applies doc style classes before returning the content body.
 */
export const extractLessonHtml = (rawHtml: string) => {
  const hasDocumentWrapper = /<html[\s>]/i.test(rawHtml) || /<body[\s>]/i.test(rawHtml);
  const html = hasDocumentWrapper ? rawHtml : `<html><body>${rawHtml}</body></html>`;
  const { document } = parseHTML(html);
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
  stripLeadingBannerImages(contentRoot);
  stripStyleNodes(styleNodes);
  stripEmptyAnchors(contentRoot);
  removeEmptyHeadings(contentRoot);
  normalizeHeadingLevels(contentRoot);
  boldenPrimaryHeadings(contentRoot);

  return contentRoot.innerHTML;
};
