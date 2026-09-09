import { runInNewContext } from "node:vm";

import { act } from "@testing-library/react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GlobalError from "@/app/global-error";
import RootLayout from "@/app/layout";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "@/lib/theme";

vi.mock("@/lib/client-error", () => ({ reportClientError: vi.fn() }));
vi.mock("@/components/app-shell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const error = new Error("Root layout failed");
let root: Root | undefined;

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = undefined;
  document.head.replaceChildren();
  document.body.replaceChildren();
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
});

describe("global error theme", () => {
  it.each(["light", "dark"])(
    "initializes a standalone %s error document before hydration",
    (theme) => {
      const html = renderToStaticMarkup(<GlobalError error={error} reset={vi.fn()} />);
      const errorDocument = new DOMParser().parseFromString(html, "text/html");
      const script = errorDocument.head.querySelector("#theme-init")?.textContent;
      expect(script).toBe(THEME_INIT_SCRIPT);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      // Run the script emitted in the standalone response without mounting React.
      runInNewContext(script!, {
        document: errorDocument,
        localStorage,
        window: { addEventListener: vi.fn() },
      });
      expect(errorDocument.documentElement.dataset.theme).toBe(theme);
      expect(errorDocument.title).toBe("Something went wrong | Tech Career Readiness");
    }
  );

  it.each([null, "invalid", "light", "dark"])(
    "restores saved value %s on a client mount",
    (saved) => {
      if (saved !== null) localStorage.setItem(THEME_STORAGE_KEY, saved);
      const reset = vi.fn();
      root = createRoot(document);
      act(() => root!.render(<GlobalError error={error} reset={reset} />));
      expect(document.documentElement.dataset.theme).toBe(saved === "dark" ? "dark" : "light");
      act(() => document.querySelector("button")!.click());
      expect(reset).toHaveBeenCalledOnce();
    }
  );

  it.each(["light", "dark"])(
    "preserves the current %s theme through a layout failure and recovery",
    (theme) => {
      root = createRoot(document);
      act(() => root!.render(<RootLayout>Course</RootLayout>));
      // The browser preference may be unavailable or stale after a blocked write.
      document.documentElement.dataset.theme = theme;
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage blocked");
      });
      act(() => root!.render(<GlobalError error={error} reset={vi.fn()} />));
      expect(document.documentElement.dataset.theme).toBe(theme);
      act(() => root!.render(<RootLayout>Recovered course</RootLayout>));
      expect(document.documentElement.dataset.theme).toBe(theme);
      expect(document.body).toHaveTextContent("Recovered course");
    }
  );

  it("still renders when storage is unavailable and no theme has been applied", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    root = createRoot(document);
    act(() => root!.render(<GlobalError error={error} reset={vi.fn()} />));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.querySelector("h1")).toHaveTextContent("We hit an unexpected error.");
  });
});
