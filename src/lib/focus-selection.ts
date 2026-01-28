import { type FocusKey, normalizeFocusKey } from "@/lib/focus-options";

/**
 * Persisted focus selection schema.
 */
export type FocusSelectionState = {
  version: 1;
  focusKey: FocusKey | null;
};

/**
 * localStorage key for focus selection.
 */
export const FOCUS_SELECTION_STORAGE_KEY = "tcr-focus-selection";
const FOCUS_SELECTION_EVENT = "tcr-focus-selection-change";

/**
 * Build the default selection state.
 */
const createEmptyState = (): FocusSelectionState => ({
  version: 1,
  focusKey: null,
});

let inMemorySelection = createEmptyState();

/**
 * Notify listeners that focus selection has changed.
 */
const notifyFocusSelectionChange = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(new Event(FOCUS_SELECTION_EVENT));
  } catch {
    // Ignore event dispatch failures.
  }
};

/**
 * Clone selection state to avoid shared mutations.
 */
const cloneState = (state: FocusSelectionState): FocusSelectionState => ({
  version: 1,
  focusKey: state.focusKey,
});

/**
 * Safely access localStorage in the browser.
 */
const getLocalStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Read focus selection from storage, falling back to in-memory state.
 */
export const readFocusSelection = (): FocusSelectionState => {
  const storage = getLocalStorage();

  if (!storage) {
    return cloneState(inMemorySelection);
  }

  try {
    const raw = storage.getItem(FOCUS_SELECTION_STORAGE_KEY);
    if (!raw) {
      const emptyState = createEmptyState();
      inMemorySelection = cloneState(emptyState);
      return cloneState(emptyState);
    }

    const parsed = JSON.parse(raw) as Partial<FocusSelectionState>;
    if (parsed?.version !== 1) {
      const emptyState = createEmptyState();
      inMemorySelection = cloneState(emptyState);
      return cloneState(emptyState);
    }

    const normalized: FocusSelectionState = {
      version: 1,
      focusKey: normalizeFocusKey(parsed.focusKey),
    };

    inMemorySelection = cloneState(normalized);
    return cloneState(normalized);
  } catch {
    return cloneState(inMemorySelection);
  }
};

/**
 * Persist a focus selection and notify listeners.
 */
export const writeFocusSelection = (focusKey: FocusKey | null) => {
  const normalized: FocusSelectionState = {
    version: 1,
    focusKey: normalizeFocusKey(focusKey),
  };

  inMemorySelection = cloneState(normalized);

  const storage = getLocalStorage();
  if (!storage) {
    notifyFocusSelectionChange();
    return;
  }

  try {
    storage.setItem(FOCUS_SELECTION_STORAGE_KEY, JSON.stringify(normalized));
    notifyFocusSelectionChange();
  } catch {
    // Keep in-memory selection as the fallback.
  }
};

/**
 * Clear the focus selection from storage and notify listeners.
 */
export const clearFocusSelection = () => {
  const cleared = createEmptyState();
  inMemorySelection = cloneState(cleared);

  const storage = getLocalStorage();
  if (!storage) {
    notifyFocusSelectionChange();
    return;
  }

  try {
    storage.removeItem(FOCUS_SELECTION_STORAGE_KEY);
    notifyFocusSelectionChange();
  } catch {
    // Keep in-memory selection cleared even if storage fails.
  }
};

/**
 * Test whether a selection has a focus key.
 */
export const hasFocusSelection = (state: FocusSelectionState) => Boolean(state.focusKey);

/**
 * Subscribe to focus selection changes (storage + custom event).
 */
export const subscribeToFocusSelection = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  /**
   * React to storage updates for the focus selection key.
   */
  const handleStorage = (event: StorageEvent) => {
    if (event.key === FOCUS_SELECTION_STORAGE_KEY) {
      callback();
    }
  };

  /**
   * React to in-memory selection changes via the custom event.
   */
  const handleEvent = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(FOCUS_SELECTION_EVENT, handleEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(FOCUS_SELECTION_EVENT, handleEvent);
  };
};
