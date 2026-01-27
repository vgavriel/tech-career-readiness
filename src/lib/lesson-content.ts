import { JSDOM, VirtualConsole } from "jsdom";
import sanitizeHtml from "sanitize-html";

import { ERROR_MESSAGE } from "@/lib/http-constants";
import {
  LESSON_CONTENT_CACHE_TTL_MS,
  getLessonContentCache,
  setLessonContentCache,
} from "@/lib/lesson-content-cache";
import { LessonDocIdMap, rewriteLessonDocLinks } from "@/lib/lesson-doc-links";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { LOG_EVENT } from "@/lib/log-constants";

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

const ALLOWED_IMAGE_HOSTS = [
  "docs.google.com",
  "googleusercontent.com",
  "gstatic.com",
];

const isAllowedImageHost = (hostname: string) =>
  ALLOWED_IMAGE_HOSTS.some((host) =>
    hostname === host ? true : hostname.endsWith(`.${host}`)
  );

const isAllowedImageSrc = (src: string | undefined) => {
  if (!src) {
    return false;
  }

  const trimmed = src.trim();
  if (!trimmed) {
    return false;
  }

  const normalized = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:") {
      return false;
    }
    return isAllowedImageHost(url.hostname);
  } catch {
    return false;
  }
};

const extractCssLengthValue = (style: string | undefined, property: string) => {
  if (!style) {
    return undefined;
  }
  const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`, "i");
  const match = style.match(regex);
  if (!match) {
    return undefined;
  }
  const value = parseCssLength(match[1].trim());
  return value === null ? undefined : Math.round(value);
};

const extractBackgroundImage = (style: string | undefined) => {
  if (!style) {
    return undefined;
  }
  const match = style.match(
    /background(?:-image)?\s*:\s*[^;]*url\(['"]?([^'")]+)['"]?\)/i
  );
  if (match?.[1]) {
    return match[1];
  }
  const fallback = style.match(/url\(['"]?([^'")]+)['"]?\)/i);
  return fallback?.[1];
};

type BackgroundImageStyle = {
  src: string;
  width?: number;
  height?: number;
};

type DocStyleMaps = {
  classStyleMap: Map<string, Set<string>>;
  backgroundImageMap: Map<string, BackgroundImageStyle>;
  styleNodes: HTMLStyleElement[];
};

const extractDocStyleMaps = (document: Document): DocStyleMaps => {
  const styleNodes = Array.from(
    document.querySelectorAll<HTMLStyleElement>("style")
  );
  const classStyleMap = new Map<string, Set<string>>();
  const backgroundImageMap = new Map<string, BackgroundImageStyle>();
  if (styleNodes.length === 0) {
    return { classStyleMap, backgroundImageMap, styleNodes };
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
    const backgroundImage = extractBackgroundImage(declarations);
    const width = extractCssLengthValue(declarations, "width");
    const height = extractCssLengthValue(declarations, "height");
    const allowedBackground =
      backgroundImage && isAllowedImageSrc(backgroundImage)
        ? backgroundImage
        : null;
    if (docClasses.length === 0) {
      if (!allowedBackground) {
        continue;
      }
    }

    for (const selector of selectors) {
      const classMatches = selector.matchAll(/\.([a-zA-Z0-9_-]+)/g);
      for (const classMatch of classMatches) {
        const className = classMatch[1];
        if (docClasses.length > 0) {
          let existing = classStyleMap.get(className);
          if (!existing) {
            existing = new Set<string>();
            classStyleMap.set(className, existing);
          }
          for (const docClass of docClasses) {
            existing.add(docClass);
          }
        }
        if (allowedBackground) {
          backgroundImageMap.set(className, {
            src: allowedBackground,
            width,
            height,
          });
        }
      }
    }
  }

  return { classStyleMap, backgroundImageMap, styleNodes };
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

const parseComputedLength = (value: string | null | undefined) => {
  if (!value) {
    return undefined;
  }
  const parsed = parseCssLength(value);
  return parsed === null ? undefined : Math.round(parsed);
};

const applyBackgroundImages = (
  root: Element,
  backgroundImageMap: Map<string, BackgroundImageStyle>
) => {
  if (backgroundImageMap.size === 0) {
    if (!root.ownerDocument?.defaultView) {
      return;
    }
  }

  const defaultView = root.ownerDocument?.defaultView;
  const elements = [root, ...Array.from(root.querySelectorAll("*"))];

  for (const element of elements) {
    if (element.tagName === "IMG") {
      continue;
    }

    const contentText = (element.textContent ?? "").replace(/\s+/g, "");
    if (contentText.length > 0) {
      continue;
    }

    let matchedStyle: BackgroundImageStyle | null = null;
    for (const className of Array.from(element.classList)) {
      const candidate = backgroundImageMap.get(className);
      if (candidate) {
        matchedStyle = candidate;
        break;
      }
    }

    if (defaultView) {
      const computedStyle = defaultView.getComputedStyle(element);
      const computedBackground = extractBackgroundImage(
        computedStyle.backgroundImage
      );
      if (!matchedStyle && computedBackground) {
        if (isAllowedImageSrc(computedBackground)) {
          matchedStyle = {
            src: computedBackground,
            width: parseComputedLength(computedStyle.width),
            height: parseComputedLength(computedStyle.height),
          };
        }
      } else if (matchedStyle) {
        matchedStyle = {
          ...matchedStyle,
          width: matchedStyle.width ?? parseComputedLength(computedStyle.width),
          height:
            matchedStyle.height ?? parseComputedLength(computedStyle.height),
        };
      }
    }

    if (!matchedStyle) {
      continue;
    }

    const img = element.ownerDocument?.createElement("img");
    if (!img) {
      continue;
    }

    img.setAttribute("src", matchedStyle.src);
    img.setAttribute("alt", "");
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.setAttribute("referrerpolicy", "no-referrer");
    if (matchedStyle.width) {
      img.setAttribute("width", matchedStyle.width.toString());
    }
    if (matchedStyle.height) {
      img.setAttribute("height", matchedStyle.height.toString());
    }

    element.replaceWith(img);
  }
};

const stripStyleNodes = (styleNodes: HTMLStyleElement[]) => {
  for (const node of styleNodes) {
    node.remove();
  }
};

const addTableCellAttributes = (attribs: sanitizeHtml.Attributes) => ({
  ...stripInlineStyle(attribs),
  valign: "top",
});

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["class", "id"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding", "referrerpolicy"],
    ol: ["class", "start"],
    li: ["class", "value"],
    table: ["class", "border", "cellpadding", "cellspacing", "width"],
    thead: ["class"],
    tbody: ["class"],
    tfoot: ["class"],
    tr: ["class"],
    th: ["class", "colspan", "rowspan", "scope", "width", "height", "valign"],
    td: ["class", "colspan", "rowspan", "width", "height", "valign"],
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
    img: (tagName, attribs) => {
      const nextAttribs: sanitizeHtml.Attributes = { ...attribs };
      const src = nextAttribs.src;
      if (!isAllowedImageSrc(src)) {
        return { tagName: "span", attribs: {}, text: "" };
      }

      const width = extractCssLengthValue(nextAttribs.style, "width");
      const height = extractCssLengthValue(nextAttribs.style, "height");
      if (width && !nextAttribs.width) {
        nextAttribs.width = width.toString();
      }
      if (height && !nextAttribs.height) {
        nextAttribs.height = height.toString();
      }
      if (!nextAttribs.alt) {
        nextAttribs.alt = "";
      }
      nextAttribs.loading = nextAttribs.loading ?? "lazy";
      nextAttribs.decoding = nextAttribs.decoding ?? "async";
      nextAttribs.referrerpolicy = nextAttribs.referrerpolicy ?? "no-referrer";
      delete nextAttribs.style;

      return { tagName, attribs: nextAttribs };
    },
    span: (tagName, attribs) => {
      const nextAttribs: sanitizeHtml.Attributes = { ...attribs };
      const background = extractBackgroundImage(nextAttribs.style);
      if (!background || !isAllowedImageSrc(background)) {
        return { tagName, attribs: stripInlineStyle(nextAttribs) };
      }

      const width = extractCssLengthValue(nextAttribs.style, "width");
      const height = extractCssLengthValue(nextAttribs.style, "height");
      const imgAttribs: sanitizeHtml.Attributes = {
        src: background,
        alt: "",
        loading: "lazy",
        decoding: "async",
        referrerpolicy: "no-referrer",
      };
      if (width) {
        imgAttribs.width = width.toString();
      }
      if (height) {
        imgAttribs.height = height.toString();
      }
      return { tagName: "img", attribs: imgAttribs };
    },
    td: (tagName, attribs) => ({
      tagName,
      attribs: addTableCellAttributes(attribs),
    }),
    th: (tagName, attribs) => ({
      tagName,
      attribs: addTableCellAttributes(attribs),
    }),
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
  const { classStyleMap, backgroundImageMap, styleNodes } =
    extractDocStyleMaps(document);

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
  applyBackgroundImages(contentRoot, backgroundImageMap);
  stripStyleNodes(styleNodes);
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
      throw new Error(ERROR_MESSAGE.LESSON_CONTENT_FETCH_FAILED);
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
  options: {
    bypassCache?: boolean;
    docIdMap?: LessonDocIdMap;
    logErrors?: boolean;
  } = {}
): Promise<LessonContentResult> {
  const { bypassCache = false, docIdMap, logErrors = true } = options;
  const env = getEnv();
  const rewriteLinks = (html: string) =>
    docIdMap ? rewriteLessonDocLinks(html, docIdMap) : html;

  if (!bypassCache) {
    const cachedHtml = await getLessonContentCache(lesson.id);
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
    const validatedUrl = assertAllowedLessonUrl(lesson.publishedUrl);
    const mockHtml = env.LESSON_CONTENT_MOCK_HTML;
    if (mockHtml && (env.isLocal || env.isTest)) {
      const sanitizedHtml = sanitizeHtml(
        rewriteLinks(mockHtml),
        sanitizeOptions
      );
      setLessonContentCache(lesson.id, sanitizedHtml, LESSON_CONTENT_CACHE_TTL_MS);
      return { lessonId: lesson.id, html: sanitizedHtml, cached: false };
    }
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
    if (logErrors) {
      logger.error(LOG_EVENT.LESSON_CONTENT_FETCH_FAILED, {
        lessonId: lesson.id,
        publishedUrl: lesson.publishedUrl,
        error,
      });
    }
    throw error;
  } finally {
    if (!bypassCache) {
      lessonContentInFlight.delete(lesson.id);
    }
  }
}
