"use client";

import { useLayoutEffect, useState } from "react";

import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "@/lib/theme";

/** Initialize both the normal and error documents, including client-side recovery. */
export default function ThemeInitializer() {
  // Capture before React removes the previous layout's document attributes.
  const [appliedTheme] = useState(() =>
    typeof document === "undefined" ? undefined : document.documentElement.dataset.theme
  );

  useLayoutEffect(() => {
    const root = document.documentElement;
    // Client-mounted script tags are inert. Restore the current choice before
    // paint, including choices that could not be saved to browser storage.
    if (appliedTheme === "light" || appliedTheme === "dark") {
      root.dataset.theme = appliedTheme;
      return;
    }
    let theme = "light";
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY) === "dark") theme = "dark";
    } catch {
      // A fresh document defaults to light when browser storage is unavailable.
    }
    root.dataset.theme = theme;
  }, [appliedTheme]);

  // The same static, CSP-hashed script applies the theme before hydration on
  // an initial response. The layout itself remains safe to prerender.
  return <script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
