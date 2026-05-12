export const DEFAULT_APP_VERSION = "dev";

const normalizeVersion = (version: string | undefined) => {
  const normalized = version?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

/**
 * Return the version attached to the current build/deploy.
 */
export const getAppVersion = () =>
  normalizeVersion(process.env.NEXT_PUBLIC_APP_VERSION) ??
  normalizeVersion(process.env.APP_VERSION) ??
  DEFAULT_APP_VERSION;
