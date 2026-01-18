import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FocusProvider, useFocus } from "@/components/focus-provider";

const sessionMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: (...args: unknown[]) => sessionMocks.useSession(...args),
}));

const buildResponse = (body: unknown, ok = true) =>
  ({
    ok,
    json: async () => body,
  } as Response);

const FocusInspector = () => {
  const { focusKey, isReady, isUpdating, setFocusKey } = useFocus();

  return (
    <div>
      <div data-testid="focus-key">{focusKey ?? "none"}</div>
      <div data-testid="ready">{isReady ? "yes" : "no"}</div>
      <div data-testid="updating">{isUpdating ? "yes" : "no"}</div>
      <button type="button" onClick={() => void setFocusKey("applying-soon")}>
        Apply focus
      </button>
    </div>
  );
};

describe("FocusProvider", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    sessionMocks.useSession.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps local focus when unauthenticated", async () => {
    sessionMocks.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(
      <FocusProvider initialFocusKey="just-starting">
        <FocusInspector />
      </FocusProvider>
    );

    expect(screen.getByTestId("focus-key")).toHaveTextContent("just-starting");
    expect(screen.getByTestId("ready")).toHaveTextContent("yes");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /apply focus/i }));

    expect(screen.getByTestId("focus-key")).toHaveTextContent("applying-soon");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads focus selection for authenticated users", async () => {
    sessionMocks.useSession.mockReturnValue({
      data: { user: { email: "ada@example.com" } },
      status: "authenticated",
    });
    fetchMock.mockResolvedValue(buildResponse({ focusKey: "offer-in-hand" }));

    render(
      <FocusProvider initialFocusKey="just-starting">
        <FocusInspector />
      </FocusProvider>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/focus",
        expect.objectContaining({ method: "GET" })
      );
    });
    expect(screen.getByTestId("focus-key")).toHaveTextContent("offer-in-hand");
    expect(screen.getByTestId("ready")).toHaveTextContent("yes");
  });

  it("updates focus through the API when authenticated", async () => {
    sessionMocks.useSession.mockReturnValue({
      data: { user: { email: "ada@example.com" } },
      status: "authenticated",
    });
    fetchMock.mockImplementation((_, options) => {
      if (options?.method === "GET") {
        return Promise.resolve(buildResponse({ focusKey: "just-starting" }));
      }
      if (options?.method === "POST") {
        return Promise.resolve(buildResponse({ focusKey: "offer-in-hand" }));
      }
      throw new Error("Unexpected fetch request.");
    });

    render(
      <FocusProvider initialFocusKey="just-starting">
        <FocusInspector />
      </FocusProvider>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/focus",
        expect.objectContaining({ method: "GET" })
      );
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /apply focus/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/focus",
        expect.objectContaining({ method: "POST" })
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("updating")).toHaveTextContent("no");
    });

    expect(screen.getByTestId("focus-key")).toHaveTextContent("offer-in-hand");
  });

  it("rolls back focus updates when the API fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    sessionMocks.useSession.mockReturnValue({
      data: { user: { email: "ada@example.com" } },
      status: "authenticated",
    });
    fetchMock.mockImplementation((_, options) => {
      if (options?.method === "GET") {
        return Promise.resolve(buildResponse({ focusKey: "just-starting" }));
      }
      if (options?.method === "POST") {
        return Promise.resolve(buildResponse({ focusKey: null }, false));
      }
      throw new Error("Unexpected fetch request.");
    });

    render(
      <FocusProvider initialFocusKey="just-starting">
        <FocusInspector />
      </FocusProvider>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/focus",
        expect.objectContaining({ method: "GET" })
      );
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /apply focus/i }));

    await waitFor(() => {
      expect(screen.getByTestId("updating")).toHaveTextContent("no");
    });

    expect(screen.getByTestId("focus-key")).toHaveTextContent("just-starting");

    consoleError.mockRestore();
  });

  it("throws when useFocus is outside the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<FocusInspector />)).toThrow(
      "useFocus must be used within FocusProvider."
    );

    consoleError.mockRestore();
  });
});
