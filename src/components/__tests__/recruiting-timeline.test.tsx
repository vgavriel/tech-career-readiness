import { readFileSync } from "node:fs";
import path from "node:path";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RecruitingTimeline from "@/components/recruiting-timeline";
import { parseRecruitingTimeline } from "@/lib/recruiting-timeline";

const sourceHtml = readFileSync(
  path.resolve("src/lib/__tests__/fixtures/recruiting-timeline.html"),
  "utf8"
);
const content = parseRecruitingTimeline(sourceHtml)!;
const element = () => <RecruitingTimeline content={content} sourceHtml={sourceHtml} />;

describe("RecruitingTimeline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T16:00:00Z"));
    window.history.replaceState(null, "", "/lesson/tech-recruiting-timeline");
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the current season, keeps the today marker while browsing, and returns to now", () => {
    render(element());
    const now = screen.getByRole("button", { name: /Sep–Oct Early Fall/ });
    expect(now).toHaveAttribute("aria-pressed", "true");
    expect(now).toHaveAttribute("aria-current", "date");
    expect(screen.getByText("Oct 13")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Jan–Feb Winter/ }));
    expect(screen.getByRole("heading", { name: "Winter" })).toBeInTheDocument();
    expect(now).toHaveAttribute("aria-current", "date");
    expect(now).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Back to now" }));
    expect(screen.getByRole("heading", { name: "Early Fall" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "technical interview prep" })).toHaveAttribute(
      "href",
      "/lesson/ace-interview-prep-timeline"
    );
  });
  it("keeps the reader focused on seasons without summaries or document controls", () => {
    render(element());
    expect(screen.getByText("Today", { exact: true })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sep–Oct Early Fall · You are here" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Apply & interview")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Read full guide" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open source Google Doc/ })).not.toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Essential Brown resources" })
    ).toBeInTheDocument();
  });
  it("keeps published and edit-form heading deep links in the full reader", () => {
    window.history.replaceState(null, "", "#heading=h.8tyi8dh7ov0i");
    render(element());
    expect(screen.getByTestId("lesson-content")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to now" }));
    expect(screen.queryByTestId("lesson-content")).not.toBeInTheDocument();
    act(() => {
      window.history.pushState(null, "", "#h.uh2fioqej0ne");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByTestId("lesson-content")).toBeInTheDocument();
  });
  it("updates the current season across the campus month boundary without losing a browsed season", () => {
    vi.setSystemTime(new Date("2026-11-01T03:59:59Z"));
    render(element());
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole("heading", { name: "Late Fall" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mar–Apr Spring/ }));
    vi.setSystemTime(new Date("2027-01-01T17:00:00Z"));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByRole("heading", { name: "Spring" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Jan–Feb Winter/ })).toHaveAttribute(
      "aria-current",
      "date"
    );
  });
  it("server-renders the entire guide for no-script reading and stable hydration", () => {
    const markup = renderToString(element());
    expect(markup).toContain("Early Summer (May–June)");
    expect(markup).toContain("Essential Brown Resources");
    expect(markup).not.toContain('aria-label="Recruiting seasons"');
  });
});
