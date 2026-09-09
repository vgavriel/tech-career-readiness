"use client";

import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Read the applied theme, including when browser storage is unavailable. */
const getTheme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
// Disable the action until hydration attaches its handler. CSS already shows
// the correct icon from the theme applied by the pre-paint script.
const getServerTheme = () => null;

/** Keep the control current across navigation and other tabs in this browser. */
const subscribe = (onChange: () => void) => {
  const root = document.documentElement;
  const observer = new MutationObserver(onChange);
  observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  return () => observer.disconnect();
};

/** A compact action button whose icon always shows the theme it switches to. */
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;

  const toggleTheme = () => {
    const nextTheme = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The toggle still works for this visit if the browser blocks storage.
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      disabled={theme === null}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className="theme-toggle-moon">
          <path d="M20.5 13.1A8.6 8.6 0 0 1 10.9 3.5 8.6 8.6 0 1 0 20.5 13.1Z" />
        </g>
        <g className="theme-toggle-sun">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </g>
      </svg>
    </button>
  );
}
