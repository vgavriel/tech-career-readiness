// @vitest-environment node

import { realpathSync } from "node:fs";
import { createRequire } from "node:module";

import { expect, it } from "vitest";

it("runs accessibility audits with the directly installed Pa11y version", () => {
  const projectRequire = createRequire(new URL("../../package.json", import.meta.url));
  const pa11yCiRequire = createRequire(projectRequire.resolve("pa11y-ci"));

  // A nested older copy would leave a direct Pa11y upgrade untested in CI.
  expect(realpathSync(pa11yCiRequire.resolve("pa11y"))).toBe(
    realpathSync(projectRequire.resolve("pa11y"))
  );
});
