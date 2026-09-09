/** Browser-only preference; independent of account and progress settings. */
export const THEME_STORAGE_KEY = "tcr-theme";

/**
 * Apply the saved theme before first paint. Keep this static: the CSP permits
 * only its exact hash, and the root layout must remain safe to prerender.
 * Light remains the default when storage is missing, invalid, or unavailable.
 */
export const THEME_INIT_SCRIPT = `(() => {
  let theme = "light";
  try {
    if (localStorage.getItem("${THEME_STORAGE_KEY}") === "dark") theme = "dark";
  } catch {}
  document.documentElement.dataset.theme = theme;
  window.addEventListener("storage", (event) => {
    if (event.key === "${THEME_STORAGE_KEY}" || event.key === null) {
      document.documentElement.dataset.theme = event.newValue === "dark" ? "dark" : "light";
    }
  });
})();`;
