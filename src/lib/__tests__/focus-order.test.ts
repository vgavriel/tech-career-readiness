import { describe, expect, it } from "vitest";

import { getFocusKeyFromParam, orderModulesForFocus } from "@/lib/focus-order";

type TestModule = {
  key: string;
  label: string;
};

const modules: TestModule[] = [
  { key: "foundations-mindset", label: "Foundations" },
  { key: "research-targeting", label: "Research" },
  { key: "resume-portfolio", label: "Resume" },
  { key: "networking-outreach", label: "Networking" },
  { key: "interview-prep", label: "Interview" },
  { key: "applications-tracking", label: "Applications" },
  { key: "offer-negotiation", label: "Offer" },
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
      "foundations-mindset",
      "interview-prep",
      "research-targeting",
      "resume-portfolio",
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
