import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/lesson/current" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

import NavigatorLayout from "@/components/navigator-layout";

const scrollTo = vi.fn();
const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollTo");

function lesson(href = "#heading=h.xbc98wpe6ddt", showHeading = true) {
  return (
    <NavigatorLayout navigator={<h2 id="outside">Navigator</h2>}>
      <a href={href}>Front-End Engineer</a>
      {showHeading ? <h2 id="h.xbc98wpe6ddt">Front-End Engineer courses</h2> : <p>Loading</p>}
    </NavigatorLayout>
  );
}

describe("lesson heading navigation", () => {
  beforeEach(() => {
    navigation.pathname = "/lesson/current";
    window.history.replaceState(null, "", "/lesson/current");
    scrollTo.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      return { top: this.id === "h.xbc98wpe6ddt" ? 420 : 20 } as DOMRect;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "/");
    if (originalScrollTo)
      Object.defineProperty(HTMLElement.prototype, "scrollTo", originalScrollTo);
    else delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
  });

  it.each([
    "#heading=h.xbc98wpe6ddt",
    "#h.xbc98wpe6ddt",
    "#heading%3Dh.xbc98wpe6ddt",
    "/lesson/current#heading=h.xbc98wpe6ddt",
    "http://localhost:3000/lesson/current#heading=h.xbc98wpe6ddt",
  ])("scrolls same-lesson link %s without reloading", (href) => {
    render(lesson(href));
    const pushState = vi.spyOn(window.history, "pushState");
    fireEvent.click(screen.getByRole("link"));
    expect(scrollTo).toHaveBeenCalledWith({ top: 384, behavior: "auto" });
    expect(window.location.hash).toBe(new URL(href, window.location.href).hash);
    fireEvent.click(screen.getByRole("link"));
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(pushState).toHaveBeenCalledTimes(1);
  });

  it("resolves a saved Google Docs deep link on arrival", () => {
    window.history.replaceState(null, "", "#heading=h.xbc98wpe6ddt");
    render(lesson());
    expect(scrollTo).toHaveBeenCalledWith({ top: 384, behavior: "auto" });
  });

  it("waits for streamed lesson content, then stops watching mutations", async () => {
    window.history.replaceState(null, "", "#heading=h.xbc98wpe6ddt");
    const view = render(lesson(undefined, false));
    expect(scrollTo).not.toHaveBeenCalled();
    view.rerender(lesson());
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 384, behavior: "auto" }));
    scrollTo.mockClear();
    await act(async () => screen.getByRole("main").appendChild(document.createElement("p")));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("retries after a client-side route change", () => {
    const view = render(lesson());
    navigation.pathname = "/lesson/next";
    window.history.replaceState(null, "", "/lesson/next#heading=h.xbc98wpe6ddt");
    view.rerender(lesson());
    expect(scrollTo).toHaveBeenCalledWith({ top: 384, behavior: "auto" });
  });

  it("abandons a missing heading after the reader follows another reference", async () => {
    window.history.replaceState(null, "", "#missing");
    render(lesson());
    fireEvent.click(screen.getByRole("link"));
    expect(scrollTo).toHaveBeenCalledOnce();
    scrollTo.mockClear();
    await act(async () => screen.getByRole("main").appendChild(document.createElement("p")));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it.each(["popstate", "hashchange"])("resolves headings after %s", (event) => {
    render(lesson());
    window.history.replaceState(null, "", "#heading=h.xbc98wpe6ddt");
    act(() => window.dispatchEvent(new Event(event)));
    expect(scrollTo).toHaveBeenCalledWith({ top: 384, behavior: "auto" });
  });

  it.each([
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
  ])("preserves modified clicks %j", (options) => {
    render(lesson("#h.xbc98wpe6ddt"));
    screen.getByRole("link").addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(screen.getByRole("link"), options);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it.each([
    "/lesson/other#heading=h.xbc98wpe6ddt",
    "/lesson/current?focus=other#heading=h.xbc98wpe6ddt",
    "https://example.com/lesson/current#heading=h.xbc98wpe6ddt",
    "#missing",
    "#outside",
    "#bad%encoding",
  ])("does not intercept other destinations: %s", (href) => {
    render(lesson(href));
    const pushState = vi.spyOn(window.history, "pushState");
    // Cancel native navigation after the capture handler has had its turn.
    screen.getByRole("link").addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(screen.getByRole("link"));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
  });

  it.each(["target", "download"])("preserves links with %s", (attribute) => {
    render(lesson("#h.xbc98wpe6ddt"));
    const link = screen.getByRole("link");
    link.setAttribute(attribute, attribute === "target" ? "_blank" : "lesson.html");
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
