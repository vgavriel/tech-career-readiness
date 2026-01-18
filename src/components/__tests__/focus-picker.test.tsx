import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FocusPicker from "@/components/focus-picker";

const focusMocks = vi.hoisted(() => ({
  setFocusKey: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("@/components/focus-provider", () => ({
  useFocus: () => ({
    setFocusKey: (...args: unknown[]) => focusMocks.setFocusKey(...args),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("FocusPicker", () => {
  beforeEach(() => {
    focusMocks.setFocusKey.mockReset();
    routerMocks.push.mockReset();
  });

  it("applies focus and routes to the start lesson", async () => {
    focusMocks.setFocusKey.mockResolvedValue(undefined);

    render(<FocusPicker startHref="/lesson/start-here" />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /just starting/i })
    );

    expect(focusMocks.setFocusKey).toHaveBeenCalledWith("just-starting");
    expect(routerMocks.push).toHaveBeenCalledWith("/lesson/start-here");
    expect(
      screen.getByRole("link", { name: /explore roles in tech/i })
    ).toHaveAttribute("href", "/roles");
  });
});
