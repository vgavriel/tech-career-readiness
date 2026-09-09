import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ThemeToggle from "@/components/theme-toggle";
import { THEME_STORAGE_KEY } from "@/lib/theme";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete document.documentElement.dataset.theme;
    localStorage.clear();
  });

  it("switches both ways with the keyboard and saves the browser preference", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toHaveFocus();

    await user.keyboard(" ");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toHaveFocus();
  });

  it("reads the theme applied before hydration and keeps it across remounts", () => {
    document.documentElement.dataset.theme = "dark";
    const { unmount } = render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    unmount();
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });

  it("remains usable when saving to storage throws", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("updates its action when the initializer applies a theme change from another tab", async () => {
    render(<ThemeToggle />);
    act(() => {
      document.documentElement.dataset.theme = "dark";
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument()
    );
    act(() => {
      document.documentElement.dataset.theme = "light";
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument()
    );
  });
});
