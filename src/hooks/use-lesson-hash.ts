"use client";

import { useSyncExternalStore } from "react";

const subscribe = (notify: () => void) => {
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);
  return () => {
    window.removeEventListener("hashchange", notify);
    window.removeEventListener("popstate", notify);
  };
};
const getSnapshot = () => window.location.hash;
const getServerSnapshot = () => "";

/** Read the same URL fragment in the reader and its interactive lesson views. */
export function useLessonHash() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Add a same-page history entry and notify readers (pushState emits no event). */
export function pushLessonHash(hash: string) {
  if (window.location.hash === hash) return;
  const oldURL = window.location.href;
  const next = new URL(oldURL);
  next.hash = hash;
  window.history.pushState(null, "", next);
  window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: next.href }));
}
