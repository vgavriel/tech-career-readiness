export type GuestProgressState = {
  version: 1;
  completed: Record<string, string>;
};

export const GUEST_PROGRESS_STORAGE_KEY = "tcr-guest-progress";

const COMPLETED_VALUE = "completed";

const createEmptyState = (): GuestProgressState => ({
  version: 1,
  completed: {},
});

let inMemoryProgress = createEmptyState();

const cloneState = (state: GuestProgressState): GuestProgressState => ({
  version: 1,
  completed: { ...state.completed },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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

    const normalized = {
      version: 1,
      completed: normalizeCompleted(parsed.completed),
    };

    inMemoryProgress = cloneState(normalized);
    return cloneState(normalized);
  } catch {
    return cloneState(inMemoryProgress);
  }
};

export const writeGuestProgress = (state: GuestProgressState) => {
  const normalized = {
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

export const updateGuestProgress = (lessonId: string, completed: boolean) => {
  const trimmedLessonId = lessonId.trim();
  if (!trimmedLessonId) {
    return cloneState(inMemoryProgress);
  }

  const state = readGuestProgress();
  const updated: GuestProgressState = {
    version: 1,
    completed: { ...state.completed },
  };

  if (completed) {
    updated.completed[trimmedLessonId] = COMPLETED_VALUE;
  } else {
    delete updated.completed[trimmedLessonId];
  }

  writeGuestProgress(updated);
  return updated;
};

export const hasGuestProgress = (state: GuestProgressState) =>
  Object.keys(state.completed).length > 0;
