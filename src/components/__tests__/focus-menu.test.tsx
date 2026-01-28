import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FocusMenu from "@/components/focus-menu";
import { FOCUS_OPTIONS } from "@/lib/focus-options";

const focusMocks = vi.hoisted(() => ({
  focusKey: null as string | null,
  isUpdating: false,
  setFocusKey: vi.fn(),
}));

vi.mock("@/components/focus-provider", () => ({
  useFocus: () => ({
    focusKey: focusMocks.focusKey,
    isUpdating: focusMocks.isUpdating,
    setFocusKey: focusMocks.setFocusKey,
  }),
}));

describe("FocusMenu", () => {
  let rafSpy: ReturnType<typeof vi.spyOn> | null = null;
  let cafSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    focusMocks.focusKey = null;
    focusMocks.isUpdating = false;
    focusMocks.setFocusKey.mockReset();
    rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
      callback(0);
      return 0;
    });
    cafSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    rafSpy?.mockRestore();
    cafSpy?.mockRestore();
    rafSpy = null;
    cafSpy = null;
  });

  it("moves focus to the first option when opened", async () => {
    const user = userEvent.setup();
    render(<FocusMenu />);

    const toggle = screen.getByRole("button", { name: /^focus$/i });
    await user.click(toggle);

    expect(
      screen.getByRole("region", { name: /focus options/i })
    ).toBeInTheDocument();
    const firstOption = screen.getByRole("button", {
      name: new RegExp(FOCUS_OPTIONS[0].label, "i"),
    });
    expect(firstOption).toHaveFocus();
  });

  it("disables clear focus when no focus is selected", async () => {
    const user = userEvent.setup();
    render(<FocusMenu />);

    await user.click(screen.getByRole("button", { name: /^focus$/i }));

    const clearButton = screen.getByRole("button", { name: /clear focus/i });
    expect(clearButton).toBeDisabled();
    expect(screen.getByRole("tooltip")).toHaveTextContent(/no focus selected/i);
    expect(clearButton).toHaveAttribute("aria-describedby");
  });

  it("enables clear focus when a focus is selected", async () => {
    focusMocks.focusKey = FOCUS_OPTIONS[0].key;
    const user = userEvent.setup();
    render(<FocusMenu />);

    await user.click(screen.getByRole("button", { name: /^focus:/i }));

    expect(
      screen.getByRole("button", { name: /clear focus/i })
    ).toBeEnabled();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("returns focus to the toggle after selecting an option", async () => {
    const user = userEvent.setup();
    render(<FocusMenu />);

    const toggle = screen.getByRole("button", { name: /^focus$/i });
    await user.click(toggle);

    const firstOption = screen.getByRole("button", {
      name: new RegExp(FOCUS_OPTIONS[0].label, "i"),
    });
    await user.click(firstOption);

    expect(focusMocks.setFocusKey).toHaveBeenCalledWith(FOCUS_OPTIONS[0].key);
    await waitFor(() => {
      expect(toggle).toHaveFocus();
    });
  });
});
