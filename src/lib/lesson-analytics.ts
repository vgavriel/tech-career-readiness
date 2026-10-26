/**
 * Google Analytics events for lessons, using the Career Exploration Library's
 * data so that both sites describe the same resource the same way.
 *
 *   lesson_view          a lesson was opened; carries the lesson's own library
 *                        values (every lesson has a row in the library sheet)
 *   resource_click       a lesson link to a library resource or another lesson;
 *                        same parameters as the library's `resource_click`
 *                        for that resource, including `page_location` set to
 *                        the resource's link, so the two sites' counts combine
 *   external_link_click  any other link inside a lesson; carries the
 *                        destination (`link_url`, `link_domain`, `link_text`)
 *                        and the current lesson's library values
 *
 * src/lib/library-resources.json is a copy of the library's resources; refresh
 * it with `npm run analytics:sync-library`.
 */

import { type EventParams, redactText, redactUrl } from "@/lib/analytics";
import libraryData from "@/lib/library-resources.json";

/** The address the library sheet uses to link to lessons. */
export const PRODUCTION_SITE_HOST = "tech-career-readiness.vercel.app";

type LibraryResource = {
  title: string;
  url: string;
  professional_pathway?: string;
  career_field?: string;
  resource_type?: string;
};

type LinkEvent = {
  event: "resource_click" | "external_link_click";
  params: EventParams;
};

const FACET_PARAMS = ["professional_pathway", "career_field", "resource_type"] as const;
const GOOGLE_FILE_HOSTS = new Set(["docs.google.com", "drive.google.com"]);
const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Follow Google's `google.com/url?q=` redirect links (used in Google Docs) to
 * their destination.
 */
const unwrapGoogleRedirect = (url: URL) => {
  let current = url;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const host = current.hostname.replace(/^www\./, "");
    const target = current.searchParams.get("q") ?? current.searchParams.get("url");
    if (host !== "google.com" || current.pathname !== "/url" || !target) {
      break;
    }
    try {
      current = new URL(target);
    } catch {
      break;
    }
  }
  return current;
};

/**
 * A key that identifies the same resource however it is linked: lessons by
 * slug, Google Docs/Drive files by id, anything else by host and path.
 */
const resourceKey = (url: URL, siteHost: string) => {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === PRODUCTION_SITE_HOST || host === siteHost) {
    const slug = url.pathname.match(/^\/lesson\/([^/]+)\/?$/)?.[1];
    return slug ? `lesson:${decodeURIComponent(slug)}` : null;
  }

  if (GOOGLE_FILE_HOSTS.has(host)) {
    const fileId =
      url.pathname.match(/\/d\/(?!e\/)([\w-]{20,})/)?.[1] ?? url.searchParams.get("id");
    if (fileId) {
      return `google:${fileId}`;
    }
  }

  return host ? `url:${host}${url.pathname.replace(/\/+$/, "")}` : null;
};

let libraryByKey: Map<string, LibraryResource> | null = null;

/**
 * The library's resources by key, built on first use.
 */
const getLibraryByKey = () => {
  if (!libraryByKey) {
    libraryByKey = new Map();
    for (const resource of libraryData.resources as LibraryResource[]) {
      let key: string | null = null;
      try {
        key = resourceKey(new URL(resource.url), PRODUCTION_SITE_HOST);
      } catch {
        continue;
      }
      if (key && !libraryByKey.has(key)) {
        libraryByKey.set(key, resource);
      }
    }
  }
  return libraryByKey;
};

/**
 * The library row for a lesson, if the library lists it.
 */
export const findLessonLibraryResource = (lessonSlug: string) =>
  getLibraryByKey().get(`lesson:${lessonSlug}`) ?? null;

/**
 * The pathway, field, and type values of a library row, under the parameter
 * names the library sends them as.
 */
const facetParams = (resource: LibraryResource | null) => {
  const params: EventParams = {};
  for (const param of FACET_PARAMS) {
    const value = resource?.[param];
    if (value) {
      params[param] = value;
    }
  }
  return params;
};

/**
 * Parameters of the `lesson_view` event.
 */
export const lessonViewParams = (lessonSlug: string, lessonTitle: string): EventParams => {
  const resource = findLessonLibraryResource(lessonSlug);
  return {
    ...facetParams(resource),
    resource_name: resource?.title ?? lessonTitle,
    lesson_slug: lessonSlug,
  };
};

/**
 * The event for a click on a link inside a lesson, or null when the link
 * stays on the page or goes to a non-lesson page of this site (page views
 * already count those).
 */
export const lessonLinkEvent = ({
  href,
  text,
  lessonSlug,
  pageUrl,
}: {
  href: string;
  text: string;
  lessonSlug: string;
  pageUrl: string;
}): LinkEvent | null => {
  let page: URL;
  let target: URL;
  try {
    page = new URL(pageUrl);
    target = unwrapGoogleRedirect(new URL(href, page));
  } catch {
    return null;
  }

  if (!LINK_PROTOCOLS.has(target.protocol)) {
    return null;
  }

  const sameOrigin = target.origin === page.origin;
  if (sameOrigin && target.pathname === page.pathname && target.search === page.search) {
    return null;
  }

  const key = resourceKey(target, page.hostname);
  const resource = key ? getLibraryByKey().get(key) : undefined;

  if (resource) {
    return {
      event: "resource_click",
      params: {
        ...facetParams(resource),
        resource_name: resource.title,
        link_url: resource.url,
        page_location: resource.url,
        lesson_slug: lessonSlug,
      },
    };
  }

  if (key?.startsWith("lesson:")) {
    // A lesson the library doesn't list (yet).
    const url = `https://${PRODUCTION_SITE_HOST}${target.pathname}`;
    return {
      event: "resource_click",
      params: {
        resource_name: redactText(text) || target.pathname,
        link_url: url,
        page_location: url,
        lesson_slug: lessonSlug,
      },
    };
  }

  if (sameOrigin) {
    return null;
  }

  return {
    event: "external_link_click",
    params: {
      ...facetParams(findLessonLibraryResource(lessonSlug)),
      lesson_slug: lessonSlug,
      link_url: redactUrl(target.href),
      link_domain: target.hostname.replace(/^www\./, "") || target.protocol.replace(":", ""),
      link_text: redactText(text),
      outbound: true,
    },
  };
};
