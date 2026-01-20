/**
 * Shape of the persisted guest progress stored in memory/localStorage.
 */
export type GuestProgressState = {
  version: 1;
  completed: Record<string, string>;
};

export const GUEST_PROGRESS_STORAGE_KEY = "tcr-guest-progress";

const COMPLETED_VALUE = "completed";

/**
 * Create a blank guest progress state with the current schema version.
 */
const createEmptyState = (): GuestProgressState => ({
  version: 1,
  completed: {},
});

let inMemoryProgress = createEmptyState();

/**
 * Clone guest progress to avoid accidental shared mutations.
 */
const cloneState = (state: GuestProgressState): GuestProgressState => ({
  version: 1,
  completed: { ...state.completed },
});

/**
 * Narrow unknown values to a non-null object record.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Normalize completed entries into the canonical lessonSlug -> "completed" map.
 */
const normalizeCompleted = (value: unknown) => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>(
    (accumulator, [key, entry]) => {
      if (typeof key !== "string") {
        return accumulator;
      }

      if (entry === true || typeof entry === "string") {
        accumulator[key] = COMPLETED_VALUE;
      }

      return accumulator;
    },
    {}
  );
};

/**
 * Safely access localStorage in the browser, returning null when unavailable.
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
 * Read guest progress from storage, falling back to in-memory state on errors.
 */
export const readGuestProgress = (): GuestProgressState => {
  const storage = getLocalStorage();

  if (!storage) {
    return cloneState(inMemoryProgress);
  }

  try {
    const raw = storage.getItem(GUEST_PROGRESS_STORAGE_KEY);
    if (!raw) {
      const emptyState = createEmptyState();
      inMemoryProgress = cloneState(emptyState);
      return cloneState(emptyState);
    }

    const parsed = JSON.parse(raw) as Partial<GuestProgressState>;
    if (parsed?.version !== 1) {
      const emptyState = createEmptyState();
      inMemoryProgress = cloneState(emptyState);
      return cloneState(emptyState);
    }

    const normalized: GuestProgressState = {
      version: 1,
      completed: normalizeCompleted(parsed.completed),
    };

    inMemoryProgress = cloneState(normalized);
    return cloneState(normalized);
  } catch {
    return cloneState(inMemoryProgress);
  }
};

/**
 * Persist guest progress to storage and update the in-memory fallback.
 */
export const writeGuestProgress = (state: GuestProgressState) => {
  const normalized: GuestProgressState = {
    version: 1,
    completed: normalizeCompleted(state.completed),
  };

  inMemoryProgress = cloneState(normalized);

  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Keep in-memory progress as the fallback.
  }
};

/**
 * Clear stored guest progress and reset the in-memory fallback.
 */
export const clearGuestProgress = () => {
  const cleared = createEmptyState();
  inMemoryProgress = cloneState(cleared);

  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(GUEST_PROGRESS_STORAGE_KEY);
  } catch {
    // Keep in-memory progress cleared even if storage fails.
  }
};

/**
 * Update a single lesson completion state and persist the result.
 */
export const updateGuestProgress = (lessonSlug: string, completed: boolean) => {
  const trimmedLessonSlug = lessonSlug.trim();
  if (!trimmedLessonSlug) {
    return cloneState(inMemoryProgress);
  }

  const state = readGuestProgress();
  const updated: GuestProgressState = {
    version: 1,
    completed: { ...state.completed },
  };

  if (completed) {
    updated.completed[trimmedLessonSlug] = COMPLETED_VALUE;
  } else {
    delete updated.completed[trimmedLessonSlug];
  }

  writeGuestProgress(updated);
  return updated;
};

/**
 * Check whether guest progress has any completed lessons.
 */
export const hasGuestProgress = (state: GuestProgressState) =>
  Object.keys(state.completed).length > 0;
