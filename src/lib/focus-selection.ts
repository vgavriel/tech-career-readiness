import { FOCUS_OPTIONS, type FocusKey } from "@/lib/focus-options";

export type FocusSelectionState = {
  version: 1;
  focusKey: FocusKey | null;
};

export const FOCUS_SELECTION_STORAGE_KEY = "tcr-focus-selection";

const createEmptyState = (): FocusSelectionState => ({
  version: 1,
  focusKey: null,
});

let inMemorySelection = createEmptyState();

const cloneState = (state: FocusSelectionState): FocusSelectionState => ({
  version: 1,
  focusKey: state.focusKey,
});

const focusKeySet = new Set(FOCUS_OPTIONS.map((option) => option.key));

const isFocusKey = (value: string): value is FocusKey => focusKeySet.has(value as FocusKey);

const normalizeFocusKey = (value: unknown): FocusKey | null => {
  if (typeof value !== "string") {
    return null;
  }

  return isFocusKey(value) ? value : null;
};

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

export const writeFocusSelection = (focusKey: FocusKey | null) => {
  const normalized: FocusSelectionState = {
    version: 1,
    focusKey: normalizeFocusKey(focusKey),
  };

  inMemorySelection = cloneState(normalized);

  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(FOCUS_SELECTION_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Keep in-memory selection as the fallback.
  }
};

export const clearFocusSelection = () => {
  const cleared = createEmptyState();
  inMemorySelection = cloneState(cleared);

  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(FOCUS_SELECTION_STORAGE_KEY);
  } catch {
    // Keep in-memory selection cleared even if storage fails.
  }
};

export const hasFocusSelection = (state: FocusSelectionState) =>
  Boolean(state.focusKey);
