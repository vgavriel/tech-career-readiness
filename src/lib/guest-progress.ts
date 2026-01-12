export type GuestProgressState = {
  version: 1;
  completed: Record<string, string>;
};

export const GUEST_PROGRESS_STORAGE_KEY = "tcr-guest-progress";

const emptyGuestProgress: GuestProgressState = {
  version: 1,
  completed: {},
};

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

      if (typeof entry === "string") {
        accumulator[key] = entry;
      }

      return accumulator;
    },
    {}
  );
};

export const readGuestProgress = (): GuestProgressState => {
  if (typeof window === "undefined") {
    return emptyGuestProgress;
  }

  const raw = window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY);
  if (!raw) {
    return emptyGuestProgress;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GuestProgressState>;
    if (parsed?.version !== 1) {
      return emptyGuestProgress;
    }

    return {
      version: 1,
      completed: normalizeCompleted(parsed.completed),
    };
  } catch {
    return emptyGuestProgress;
  }
};

export const writeGuestProgress = (state: GuestProgressState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(state));
};

export const clearGuestProgress = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(GUEST_PROGRESS_STORAGE_KEY);
};

export const updateGuestProgress = (lessonId: string, completed: boolean) => {
  const trimmedLessonId = lessonId.trim();
  if (!trimmedLessonId) {
    return emptyGuestProgress;
  }

  const state = readGuestProgress();
  const updated: GuestProgressState = {
    version: 1,
    completed: { ...state.completed },
  };

  if (completed) {
    updated.completed[trimmedLessonId] = new Date().toISOString();
  } else {
    delete updated.completed[trimmedLessonId];
  }

  writeGuestProgress(updated);
  return updated;
};

export const hasGuestProgress = (state: GuestProgressState) =>
  Object.keys(state.completed).length > 0;
