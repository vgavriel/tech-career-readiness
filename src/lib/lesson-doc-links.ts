import { parseHTML } from "linkedom";

/**
 * Map of Google Doc ID to lesson slug.
 */
export type LessonDocIdMap = Map<string, string>;

type ParsedLessonDocLink = {
  docId: string;
  hash: string;
};

/**
 * Extract a document id from URL path segments.
 */
const extractDocIdFromSegments = (
  segments: string[],
  marker: string,
  disallowed: Set<string> = new Set()
) => {
  const markerIndex = segments.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const dIndex = segments.indexOf("d", markerIndex + 1);
  if (dIndex === -1) {
    return null;
  }

  const candidate = segments[dIndex + 1];
  if (!candidate || disallowed.has(candidate)) {
    return null;
  }

  return candidate;
};

/**
 * Parse a lesson-related Google Docs or Drive link.
 */
const parseLessonDocLink = (href: string | null | undefined): ParsedLessonDocLink | null => {
  if (!href) {
    return null;
  }

  let currentHref = href.trim();
  if (!currentHref) {
    return null;
  }

  const seen = new Set<string>();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (seen.has(currentHref)) {
      return null;
    }
    seen.add(currentHref);

    let url: URL;
    try {
      url = new URL(currentHref);
    } catch {
      return null;
    }

    const host = url.hostname.replace(/^www\./, "");
    if (host === "google.com" && url.pathname === "/url") {
      const target = url.searchParams.get("q") ?? url.searchParams.get("url");
      if (target && target !== currentHref) {
        currentHref = target;
        continue;
      }
    }

    const segments = url.pathname.split("/").filter(Boolean);
    let docId: string | null = null;

    if (host === "docs.google.com") {
      docId = extractDocIdFromSegments(segments, "document", new Set(["e"]));
    } else if (host === "drive.google.com") {
      docId = extractDocIdFromSegments(segments, "file");
      if (!docId) {
        docId = url.searchParams.get("id");
      }
    }

    if (!docId) {
      return null;
    }

    return { docId, hash: url.hash };
  }

  return null;
};

/**
 * Extract a Google Doc id from a URL, returning null when invalid.
 *
 * Ignores published doc URLs and unwraps Google redirect links when present.
 */
export const extractGoogleDocIdFromUrl = (href: string | null | undefined) =>
  parseLessonDocLink(href)?.docId ?? null;

/**
 * Rewrite lesson links in HTML to internal /lesson/:slug paths.
 */
export const rewriteLessonDocLinks = (html: string, docIdMap: LessonDocIdMap) => {
  if (!html || docIdMap.size === 0) {
    return html;
  }

  const { document } = parseHTML(`<html><body>${html}</body></html>`);
  let didChange = false;

  for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
    const parsed = parseLessonDocLink(anchor.getAttribute("href"));
    if (!parsed) {
      continue;
    }

    const slug = docIdMap.get(parsed.docId);
    if (!slug) {
      continue;
    }

    const nextHref = parsed.hash ? `/lesson/${slug}${parsed.hash}` : `/lesson/${slug}`;

    if (anchor.getAttribute("href") !== nextHref) {
      anchor.setAttribute("href", nextHref);
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
      didChange = true;
    }
  }

  return didChange ? document.body.innerHTML : html;
};
