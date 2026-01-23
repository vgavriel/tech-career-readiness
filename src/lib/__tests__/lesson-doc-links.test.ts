import { describe, expect, it } from "vitest";

import {
  extractGoogleDocIdFromUrl,
  rewriteLessonDocLinks,
} from "@/lib/lesson-doc-links";

describe("extractGoogleDocIdFromUrl", () => {
  it("extracts doc ids from edit links", () => {
    expect(
      extractGoogleDocIdFromUrl(
        "https://docs.google.com/document/d/abc123/edit?usp=sharing"
      )
    ).toBe("abc123");
    expect(
      extractGoogleDocIdFromUrl(
        "https://docs.google.com/document/u/0/d/abc123/edit"
      )
    ).toBe("abc123");
  });

  it("extracts doc ids from drive links", () => {
    expect(
      extractGoogleDocIdFromUrl(
        "https://drive.google.com/file/d/xyz456/view"
      )
    ).toBe("xyz456");
    expect(
      extractGoogleDocIdFromUrl("https://drive.google.com/open?id=xyz456")
    ).toBe("xyz456");
  });

  it("unwraps Google redirect links", () => {
    expect(
      extractGoogleDocIdFromUrl(
        "https://www.google.com/url?q=https://drive.google.com/open?id%3Dxyz456%26usp%3Ddrive_copy&sa=D"
      )
    ).toBe("xyz456");
  });

  it("ignores published doc URLs", () => {
    expect(
      extractGoogleDocIdFromUrl(
        "https://docs.google.com/document/d/e/2PACX-1vExample/pub"
      )
    ).toBeNull();
  });
});

describe("rewriteLessonDocLinks", () => {
  it("rewrites doc links to lesson slugs and removes external attributes", () => {
    const html = [
      '<p><a href="https://docs.google.com/document/d/abc123/edit#heading=h.1">Go</a></p>',
      '<p><a href="https://example.com" target="_blank">External</a></p>',
    ].join("");
    const map = new Map([["abc123", "target-slug"]]);

    const result = rewriteLessonDocLinks(html, map);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = result;

    const rewritten = wrapper.querySelector('a[href^="/lesson/"]');
    expect(rewritten).not.toBeNull();
    expect(rewritten).toHaveAttribute("href", "/lesson/target-slug#heading=h.1");
    expect(rewritten).not.toHaveAttribute("target");
    expect(rewritten).not.toHaveAttribute("rel");

    const external = wrapper.querySelector('a[href="https://example.com"]');
    expect(external).toHaveAttribute("target", "_blank");
  });
});
