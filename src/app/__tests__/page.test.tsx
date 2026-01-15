import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("Home page", () => {
  it("renders the hero and primary CTAs", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /structured path from student to hired engineer/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /view the roadmap/i })).toHaveAttribute(
      "href",
      "/roadmap"
    );

    expect(
      screen.getByRole("button", { name: /sign in to save progress/i })
    ).toBeInTheDocument();
  });
});
