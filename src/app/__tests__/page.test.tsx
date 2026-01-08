import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
    const {
      priority: _priority,
      alt,
      ...rest
    } = props as ImgHTMLAttributes<HTMLImageElement> & {
      priority?: boolean;
    };
    void _priority;
    return <img alt={alt ?? ""} {...rest} />;
  },
}));

describe("Home page", () => {
  it("renders the main heading and primary CTAs", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /to get started, edit the page\.tsx file\./i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /deploy now/i })).toHaveAttribute(
      "href",
      expect.stringContaining("vercel.com/new")
    );

    expect(
      screen.getByRole("link", { name: /documentation/i })
    ).toHaveAttribute(
      "href",
      expect.stringContaining("nextjs.org/docs")
    );
  });
});
