import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FocusPicker from "@/components/focus-picker";

const focusMocks = vi.hoisted(() => ({
  setFocusKey: vi.fn(),
}));

vi.mock("@/components/focus-provider", () => ({
  useFocus: () => ({
    focusKey: null,
    setFocusKey: (...args: unknown[]) => focusMocks.setFocusKey(...args),
  }),
}));

describe("FocusPicker", () => {
  beforeEach(() => {
    focusMocks.setFocusKey.mockReset();
  });

  it("updates focus selection", async () => {
    focusMocks.setFocusKey.mockResolvedValue(undefined);

    render(<FocusPicker />);

    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByLabelText(/timeline/i),
      "just-starting"
    );

    expect(focusMocks.setFocusKey).toHaveBeenCalledWith("just-starting");
  });
});
