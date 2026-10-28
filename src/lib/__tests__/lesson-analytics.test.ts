import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  findLessonLibraryResource,
  lessonLinkEvent,
  lessonViewParams,
  PRODUCTION_SITE_HOST,
} from "@/lib/lesson-analytics";
import libraryData from "@/lib/library-resources.json";

const PAGE_URL = `https://${PRODUCTION_SITE_HOST}/lesson/learn-about-backend-engineering`;

const seededLessonSlugs = () => {
  const seed = readFileSync(path.resolve(__dirname, "../../../prisma/seed.js"), "utf8");
  return [...seed.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((match) => match[1]);
};

const libraryResource = (predicate: (url: URL) => boolean) => {
  const resource = libraryData.resources.find((entry) => predicate(new URL(entry.url)));
  if (!resource) {
    throw new Error("Expected the library data to contain a matching resource.");
  }
  return resource;
};

const linkEvent = (href: string, text = "Link text") =>
  lessonLinkEvent({ href, text, lessonSlug: "learn-about-backend-engineering", pageUrl: PAGE_URL });

describe("lesson analytics", () => {
  it("has a library row for every seeded lesson (run npm run analytics:sync-library)", () => {
    const slugs = seededLessonSlugs();
    expect(slugs.length).toBeGreaterThan(40);
    expect(slugs.filter((slug) => !findLessonLibraryResource(slug))).toEqual([]);
  });

  it("describes a lesson view with the lesson's library values", () => {
    const resource = findLessonLibraryResource("learn-about-backend-engineering");

    expect(lessonViewParams("learn-about-backend-engineering", "Backend")).toEqual({
      professional_pathway: resource?.professional_pathway,
      career_field: resource?.career_field,
      resource_type: resource?.resource_type,
      resource_name: resource?.title,
      lesson_slug: "learn-about-backend-engineering",
    });
    expect(resource?.career_field).toBe("Backend Engineering");
  });

  it("falls back to the lesson title for lessons the library doesn't list", () => {
    expect(lessonViewParams("not-in-library", "New lesson")).toEqual({
      resource_name: "New lesson",
      lesson_slug: "not-in-library",
    });
  });

  it("reports links to other lessons as the library's resource_click", () => {
    const resource = findLessonLibraryResource("tech-recruiting-timeline");

    expect(linkEvent("/lesson/tech-recruiting-timeline#fall")).toEqual({
      event: "resource_click",
      params: {
        professional_pathway: resource?.professional_pathway,
        career_field: resource?.career_field,
        resource_type: resource?.resource_type,
        resource_name: resource?.title,
        link_url: resource?.url,
        page_location: resource?.url,
        lesson_slug: "learn-about-backend-engineering",
      },
    });
  });

  it("matches library Google Docs however the link is written", () => {
    const resource = libraryResource(
      (url) => url.hostname === "docs.google.com" && url.pathname.startsWith("/document/d/")
    );
    const docId = new URL(resource.url).pathname.split("/")[3];
    const wrapped = `https://www.google.com/url?q=${encodeURIComponent(
      `https://docs.google.com/document/d/${docId}/edit?usp=sharing`
    )}&sa=D`;

    const event = linkEvent(wrapped);
    expect(event?.event).toBe("resource_click");
    expect(event?.params).toMatchObject({
      resource_name: resource.title,
      link_url: resource.url,
      page_location: resource.url,
    });
  });

  it("matches other library links by host and path", () => {
    const resource = libraryResource((url) => url.hostname === "www.levels.fyi");

    expect(linkEvent("https://levels.fyi/")?.params).toMatchObject({
      resource_name: resource.title,
    });
  });

  it("reports lessons missing from the library as resource_click with the link text", () => {
    expect(linkEvent("/lesson/brand-new-lesson", "A brand new lesson")).toEqual({
      event: "resource_click",
      params: {
        resource_name: "A brand new lesson",
        link_url: `https://${PRODUCTION_SITE_HOST}/lesson/brand-new-lesson`,
        page_location: `https://${PRODUCTION_SITE_HOST}/lesson/brand-new-lesson`,
        lesson_slug: "learn-about-backend-engineering",
      },
    });
  });

  it("reports other links as external_link_click with the destination and lesson values", () => {
    const lesson = findLessonLibraryResource("learn-about-backend-engineering");

    expect(
      linkEvent(
        "https://www.google.com/url?q=https://www.linkedin.com/jobs/view/4012345678&sa=D",
        " LinkedIn   jobs "
      )
    ).toEqual({
      event: "external_link_click",
      params: {
        professional_pathway: lesson?.professional_pathway,
        career_field: lesson?.career_field,
        resource_type: lesson?.resource_type,
        lesson_slug: "learn-about-backend-engineering",
        link_url: "https://www.linkedin.com/jobs/view/4012345678",
        link_domain: "linkedin.com",
        link_text: "LinkedIn jobs",
        outbound: true,
      },
    });
  });

  it("removes email addresses from mailto links", () => {
    expect(
      linkEvent("mailto:CareerCenter@brown.edu", "CareerCenter@brown.edu")?.params
    ).toMatchObject({
      link_url: "mailto:[email]",
      link_domain: "mailto",
      link_text: "[email]",
    });
  });

  it("drops long query strings from external link URLs so GA4 keeps them", () => {
    const href = `https://www.linkedin.com/school/brown-university/people/?keywords=${"backend%20engineer%20OR%20".repeat(5)}`;

    expect(linkEvent(href)?.params.link_url).toBe(
      "https://www.linkedin.com/school/brown-university/people/"
    );
  });

  it("does not throw on malformed escapes in lesson links", () => {
    expect(linkEvent("/lesson/bad%zz", "Broken link")).toEqual({
      event: "resource_click",
      params: expect.objectContaining({
        resource_name: "Broken link",
        link_url: `https://${PRODUCTION_SITE_HOST}/lesson/bad%zz`,
      }),
    });
  });

  it("removes URL-encoded email addresses from link URLs", () => {
    expect(linkEvent("mailto:student%40brown.edu")?.params.link_url).toBe("mailto:[email]");
    expect(linkEvent("https://example.com/signup?email=student%40brown.edu")?.params.link_url).toBe(
      "https://example.com/signup?email=[email]"
    );
  });

  it.each([
    ["an in-page heading link", "#h.abc123"],
    ["the same page", PAGE_URL],
    ["another page of this site", "/roadmap"],
    ["a javascript: link", "javascript:void(0)"],
    ["an invalid URL", "https://"],
  ])("ignores %s", (_label, href) => {
    expect(linkEvent(href)).toBeNull();
  });
});
