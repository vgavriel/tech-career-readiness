import { JSDOM, VirtualConsole } from "jsdom";
import sanitizeHtml from "sanitize-html";

import {
  LESSON_CONTENT_CACHE_TTL_MS,
  getLessonContentCache,
  setLessonContentCache,
} from "@/lib/lesson-content-cache";
import { LessonDocIdMap, rewriteLessonDocLinks } from "@/lib/lesson-doc-links";
import { getEnv } from "@/lib/env";

const allowedLessonHosts = new Set(["docs.google.com", "drive.google.com"]);

const LESSON_CONTENT_FETCH_TIMEOUT_MS = 8000;

const INDENT_STEP_PX = 24;
const MAX_INDENT_LEVEL = 4;

const parseCssLength = (value: string) => {
  const match = value.trim().match(/^(-?\d*\.?\d+)(px|pt|rem|em)?$/);
  if (!match) {
    return null;
  }

  const numeric = Number.parseFloat(match[1]);
  if (Number.isNaN(numeric)) {
    return null;
  }

  const unit = match[2] ?? "px";
  if (unit === "pt") {
    return numeric * (4 / 3);
  }
  if (unit === "rem" || unit === "em") {
    return numeric * 16;
  }

  return numeric;
};

const extractIndentClass = (styleValue: string) => {
  const normalized = styleValue.toLowerCase();
  const candidates = [
    normalized.match(/margin-left\s*:\s*([^;]+)/)?.[1],
    normalized.match(/padding-left\s*:\s*([^;]+)/)?.[1],
    normalized.match(/text-indent\s*:\s*([^;]+)/)?.[1],
  ]
    .map((value) => (value ? parseCssLength(value) : null))
    .filter((value): value is number => value !== null && value > 0);

  if (candidates.length === 0) {
    return null;
  }

  const maxValue = Math.max(...candidates);
  const level = Math.min(
    MAX_INDENT_LEVEL,
    Math.max(1, Math.round(maxValue / INDENT_STEP_PX))
  );

  return `doc-indent-${level}`;
};

const extractDocStyleClasses = (styleValue: string) => {
  const classes = new Set<string>();
  const normalized = styleValue.toLowerCase();
  const fontWeightMatch = normalized.match(/font-weight\s*:\s*([^;]+)/);
  if (fontWeightMatch) {
    const weight = fontWeightMatch[1].trim();
    const numeric = Number.parseInt(weight, 10);
    if (weight === "bold" || (!Number.isNaN(numeric) && numeric >= 600)) {
      classes.add("doc-bold");
    }
  }

  const fontStyleMatch = normalized.match(/font-style\s*:\s*([^;]+)/);
  if (fontStyleMatch && /(italic|oblique)/.test(fontStyleMatch[1])) {
    classes.add("doc-italic");
  }

  const textDecorationMatch = normalized.match(
    /text-decoration(?:-line)?\s*:\s*([^;]+)/
  );
  if (textDecorationMatch && textDecorationMatch[1].includes("underline")) {
    classes.add("doc-underline");
  }

  const indentClass = extractIndentClass(styleValue);
  if (indentClass) {
    classes.add(indentClass);
  }

  return Array.from(classes);
};

const mergeClassNames = (existing: string | undefined, additions: string[]) => {
  if (additions.length === 0) {
    return existing;
  }

  const merged = new Set<string>(
    (existing ?? "")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean)
  );
  for (const addition of additions) {
    merged.add(addition);
  }

  return Array.from(merged).join(" ");
};

const stripInlineStyle = (
  attribs: sanitizeHtml.Attributes
): sanitizeHtml.Attributes => {
  const nextAttribs: sanitizeHtml.Attributes = { ...attribs };
  const styleValue = nextAttribs.style;
  if (!styleValue) {
    return nextAttribs;
  }

  const classes = extractDocStyleClasses(styleValue);
  const mergedClass = mergeClassNames(nextAttribs.class, classes);
  if (mergedClass) {
    nextAttribs.class = mergedClass;
  }
  delete nextAttribs.style;

  return nextAttribs;
};

const extractDocClassStyleMap = (document: Document) => {
  const styleNodes = Array.from(document.querySelectorAll("style"));
  const map = new Map<string, Set<string>>();
  if (styleNodes.length === 0) {
    return map;
  }

  const cssText = styleNodes
    .map((node) => node.textContent ?? "")
    .join("\n");
  const ruleRegex = /([^{}]+)\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(cssText)) !== null) {
    const selectors = match[1].split(",");
    const declarations = match[2];
    const docClasses = extractDocStyleClasses(declarations);
    if (docClasses.length === 0) {
      continue;
    }

    for (const selector of selectors) {
      const classMatches = selector.matchAll(/\.([a-zA-Z0-9_-]+)/g);
      for (const classMatch of classMatches) {
        const className = classMatch[1];
        let existing = map.get(className);
        if (!existing) {
          existing = new Set<string>();
          map.set(className, existing);
        }
        for (const docClass of docClasses) {
          existing.add(docClass);
        }
      }
    }
  }

  styleNodes.forEach((node) => node.remove());
  return map;
};

const applyDocClassStyles = (
  root: Element,
  classStyleMap: Map<string, Set<string>>
) => {
  if (classStyleMap.size === 0) {
    return;
  }

  const elements = root.matches("[class]")
    ? [root, ...Array.from(root.querySelectorAll("[class]"))]
    : Array.from(root.querySelectorAll("[class]"));

  for (const element of elements) {
    const additions = new Set<string>();
    for (const className of Array.from(element.classList)) {
      const mapped = classStyleMap.get(className);
      if (mapped) {
        for (const docClass of mapped) {
          additions.add(docClass);
        }
      }
    }
    for (const docClass of additions) {
      element.classList.add(docClass);
    }
  }
};

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags,
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["class", "id"],
    a: ["href", "name", "target", "rel"],
    ol: ["class", "start"],
    li: ["class", "value"],
    table: ["class", "border", "cellpadding", "cellspacing", "width"],
    thead: ["class"],
    tbody: ["class"],
    tfoot: ["class"],
    tr: ["class"],
    th: ["class", "colspan", "rowspan", "scope", "width", "height"],
    td: ["class", "colspan", "rowspan", "width", "height"],
    colgroup: ["class", "span", "width"],
    col: ["class", "span", "width"],
  },
  transformTags: {
    a: (tagName, attribs) => {
      const nextAttribs: sanitizeHtml.Attributes = { ...attribs };
      if (isExternalHref(nextAttribs.href)) {
        nextAttribs.target = "_blank";
        const rel = new Set(
          (nextAttribs.rel ?? "")
            .split(/\s+/)
            .map((value) => value.trim())
            .filter(Boolean)
        );
        rel.add("noopener");
        rel.add("noreferrer");
        nextAttribs.rel = Array.from(rel).join(" ");
      } else {
        delete nextAttribs.target;
        delete nextAttribs.rel;
      }
      return { tagName, attribs: nextAttribs };
    },
    "*": (tagName, attribs) => ({
      tagName,
      attribs: stripInlineStyle(attribs),
    }),
  },
};

const GOOGLE_DOCS_BANNER_PHRASES = [
  "Published using Google Docs",
  "Report abuse",
  "Updated automatically every 5 minutes",
];

const normalizeBannerText = (text: string) => text.replace(/\s+/g, " ").trim();
const normalizeContentText = (text: string) =>
  normalizeBannerText(text).toLowerCase();

const LESSON_FOOTER_PHRASES = [
  "questions? reach out",
  "author:",
  "last updated",
];

const isExternalHref = (href: string | undefined) => {
  if (!href) {
    return false;
  }

  const trimmed = href.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("//")) {
    return true;
  }

  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("sms:")
  ) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const hasMeaningfulText = (text: string | null | undefined) =>
  normalizeBannerText(text ?? "") !== "";

const removeEmptyHeadings = (root: Element) => {
  for (const heading of Array.from(
    root.querySelectorAll("h1,h2,h3,h4,h5,h6")
  )) {
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
    if (
      text &&
      GOOGLE_DOCS_BANNER_PHRASES.some((phrase) => text.includes(phrase))
    ) {
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

  const stripped = text.replace(/[\s\-–—_•·.]+/g, "");
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
    if (
      isDividerElement(previous) ||
      !hasMeaningfulText(previous.textContent)
    ) {
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

  if (
    parent &&
    parent !== root &&
    normalizeBannerText(parent.textContent ?? "") === ""
  ) {
    parent.remove();
  }

};

const extractLessonHtml = (rawHtml: string) => {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(rawHtml, { virtualConsole });
  const document = dom.window.document;
  const classStyleMap = extractDocClassStyleMap(document);

  const contentRoot =
    document.querySelector("#contents") ??
    document.querySelector(".doc-content") ??
    document.body;

  if (!contentRoot) {
    return rawHtml;
  }

  removeLessonTitle(contentRoot);
  stripGoogleDocsBanner(contentRoot);
  stripLessonFooter(contentRoot);
  stripHorizontalRules(contentRoot);
  trimTableCellWhitespace(contentRoot);
  applyDocClassStyles(contentRoot, classStyleMap);
  stripEmptyAnchors(contentRoot);
  removeEmptyHeadings(contentRoot);
  normalizeHeadingLevels(contentRoot);
  boldenPrimaryHeadings(contentRoot);

  return contentRoot.innerHTML;
};

/**
 * Minimal lesson data required to fetch content.
 */
type LessonSource = {
  id: string;
  publishedUrl: string;
};

/**
 * Result of fetching lesson content with cache metadata.
 */
export type LessonContentResult = {
  lessonId: string;
  html: string;
  cached: boolean;
};

const lessonContentInFlight = new Map<string, Promise<LessonContentResult>>();

/**
 * Validate and return the lesson URL, enforcing the allowlist.
 */
const assertAllowedLessonUrl = (publishedUrl: string) => {
  let url: URL;

  try {
    url = new URL(publishedUrl);
  } catch {
    throw new Error("Lesson URL is invalid.");
  }

  if (url.protocol !== "https:" || !allowedLessonHosts.has(url.hostname)) {
    throw new Error("Lesson URL is not allowed.");
  }

  return url;
};

const fetchWithTimeout = async (
  input: string,
  init: RequestInit,
  timeoutMs: number
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Fetch published lesson HTML, following safe redirects up to the limit.
 */
const fetchLessonHtml = async (url: URL, maxRedirects = 3) => {
  let currentUrl = url;

  for (let attempt = 0; attempt <= maxRedirects; attempt += 1) {
    const response = await fetchWithTimeout(
      currentUrl.toString(),
      {
        cache: "no-store",
        redirect: "manual",
      },
      LESSON_CONTENT_FETCH_TIMEOUT_MS
    );

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.get("location")
    ) {
      const redirectUrl = new URL(response.headers.get("location") ?? "", currentUrl);
      if (
        redirectUrl.protocol !== "https:" ||
        !allowedLessonHosts.has(redirectUrl.hostname)
      ) {
        throw new Error("Lesson URL is not allowed.");
      }

      currentUrl = redirectUrl;
      continue;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch lesson content.");
    }

    return response.text();
  }

  throw new Error("Too many redirects while fetching lesson content.");
};

/**
 * Fetch, sanitize, and cache lesson HTML for the given lesson source.
 */
export async function fetchLessonContent(
  lesson: LessonSource,
  options: { bypassCache?: boolean; docIdMap?: LessonDocIdMap } = {}
): Promise<LessonContentResult> {
  const { bypassCache = false, docIdMap } = options;
  const env = getEnv();
  const rewriteLinks = (html: string) =>
    docIdMap ? rewriteLessonDocLinks(html, docIdMap) : html;

  if (!bypassCache) {
    const cachedHtml = getLessonContentCache(lesson.id);
    if (cachedHtml) {
      const rewrittenHtml = rewriteLinks(cachedHtml);
      if (rewrittenHtml !== cachedHtml) {
        setLessonContentCache(
          lesson.id,
          rewrittenHtml,
          LESSON_CONTENT_CACHE_TTL_MS
        );
      }
      return { lessonId: lesson.id, html: rewrittenHtml, cached: true };
    }
  }

  if (!bypassCache) {
    const inFlight = lessonContentInFlight.get(lesson.id);
    if (inFlight) {
      return inFlight;
    }
  }

  const fetchPromise = (async () => {
    const mockHtml = env.LESSON_CONTENT_MOCK_HTML;
    if (mockHtml && (env.isLocal || env.isTest)) {
      const sanitizedHtml = sanitizeHtml(
        rewriteLinks(mockHtml),
        sanitizeOptions
      );
      setLessonContentCache(lesson.id, sanitizedHtml, LESSON_CONTENT_CACHE_TTL_MS);
      return { lessonId: lesson.id, html: sanitizedHtml, cached: false };
    }

    const validatedUrl = assertAllowedLessonUrl(lesson.publishedUrl);
    const rawHtml = await fetchLessonHtml(validatedUrl);
    const extractedHtml = extractLessonHtml(rawHtml);
    const sanitizedHtml = sanitizeHtml(
      rewriteLinks(extractedHtml),
      sanitizeOptions
    );
    setLessonContentCache(lesson.id, sanitizedHtml, LESSON_CONTENT_CACHE_TTL_MS);

    return { lessonId: lesson.id, html: sanitizedHtml, cached: false };
  })();

  if (!bypassCache) {
    lessonContentInFlight.set(lesson.id, fetchPromise);
  }

  try {
    return await fetchPromise;
  } catch (error) {
    console.error("Failed to fetch lesson content.", {
      lessonId: lesson.id,
      publishedUrl: lesson.publishedUrl,
      error,
    });
    throw error;
  } finally {
    if (!bypassCache) {
      lessonContentInFlight.delete(lesson.id);
    }
  }
}
