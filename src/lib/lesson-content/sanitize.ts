import sanitizeHtml from "sanitize-html";

import { stripInlineStyle } from "@/lib/lesson-content/doc-styles";
import {
  extractBackgroundImage,
  extractCssLengthValue,
  isAllowedImageSrc,
} from "@/lib/lesson-content/images";

/**
 * Remove undefined attribute values while preserving provided keys.
 */
const normalizeAttributes = (
  attribs: Record<string, string | undefined>
): sanitizeHtml.Attributes =>
  Object.fromEntries(
    Object.entries(attribs).filter(([, value]) => value !== undefined)
  ) as sanitizeHtml.Attributes;

/**
 * Normalize table cell attributes and strip inline styles.
 */
const addTableCellAttributes = (attribs: sanitizeHtml.Attributes) =>
  normalizeAttributes({
    ...stripInlineStyle(attribs),
    valign: "top",
  });

/**
 * Determine if a link points outside the app and should open in a new tab.
 */
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

/**
 * Sanitize and normalize lesson HTML from Google Docs.
 */
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
        return { tagName, attribs: normalizeAttributes(stripInlineStyle(nextAttribs)) };
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
      attribs: normalizeAttributes(stripInlineStyle(attribs)),
    }),
  },
};

/**
 * Sanitize lesson HTML using the shared allowlist and transforms.
 *
 * Ensures external links open safely and strips untrusted images/styles.
 */
export const sanitizeLessonHtml = (html: string) => sanitizeHtml(html, sanitizeOptions);
