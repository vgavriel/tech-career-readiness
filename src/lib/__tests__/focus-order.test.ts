import { describe, expect, it } from "vitest";

import { getFocusKeyFromParam, orderModulesForFocus } from "@/lib/focus-order";

type TestModule = {
  key: string;
  label: string;
};

const modules: TestModule[] = [
  { key: "start-here", label: "Start" },
  { key: "explore-roles", label: "Explore" },
  { key: "build-experience", label: "Experience" },
  { key: "opportunities-networking", label: "Networking" },
  { key: "research-companies", label: "Research" },
  { key: "applications", label: "Applications" },
  { key: "interviews", label: "Interviews" },
  { key: "offers", label: "Offers" },
  { key: "internship-success", label: "Internship" },
];

const moduleKeys = (items: TestModule[]) => items.map((item) => item.key);

describe("focus ordering", () => {
  it("returns null for unknown focus params", () => {
    expect(getFocusKeyFromParam("not-real")).toBeNull();
  });

  it("parses focus params from arrays", () => {
    expect(getFocusKeyFromParam(["applying-soon"])).toBe("applying-soon");
  });

  it("filters and orders modules for a focus", () => {
    const ordered = orderModulesForFocus(modules, "interviewing-soon");
    expect(moduleKeys(ordered)).toEqual([
      "start-here",
      "interviews",
      "research-companies",
      "applications",
    ]);
  });

  it("falls back when focus ordering produces no matches", () => {
    const ordered = orderModulesForFocus(
      [{ key: "unknown", label: "X" }],
      "offer-in-hand"
    );
    expect(moduleKeys(ordered)).toEqual(["unknown"]);
  });
});
