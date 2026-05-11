import { execFileSync } from "node:child_process";

const SHORT_SHA_LENGTH = 7;
const LOCAL_SHA = "local";

const firstNonEmpty = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();

/**
 * Return a UTC date segment for date-based deploy versions.
 */
export const formatVersionDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
};

/**
 * Normalize a Git SHA into the compact suffix used by deploy versions.
 */
export const normalizeShortSha = (sha) => {
  if (!sha) {
    return LOCAL_SHA;
  }

  const normalized = sha.trim().toLowerCase();
  if (!/^[0-9a-f]{7,40}$/.test(normalized)) {
    return LOCAL_SHA;
  }

  return normalized.slice(0, SHORT_SHA_LENGTH);
};

/**
 * Build the canonical date-based version string.
 */
export const buildDateVersion = ({ date, sha }) =>
  `${formatVersionDate(date)}.${normalizeShortSha(sha)}`;

const readGitValue = (args) => {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const parseDate = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const readCommitSha = (env) =>
  firstNonEmpty(env.VERCEL_GIT_COMMIT_SHA, env.GITHUB_SHA, readGitValue(["rev-parse", "HEAD"]));

const readCommitDate = (sha, fallback) => {
  const gitDate =
    (sha ? readGitValue(["show", "-s", "--format=%cI", sha]) : null) ??
    readGitValue(["show", "-s", "--format=%cI", "HEAD"]);
  return parseDate(gitDate, fallback);
};

/**
 * Resolve the build version used by deploy artifacts.
 */
export const resolveBuildVersion = ({ env = process.env, now = new Date() } = {}) => {
  const explicitVersion = firstNonEmpty(env.NEXT_PUBLIC_APP_VERSION, env.APP_VERSION);
  if (explicitVersion) {
    return {
      source: "env",
      version: explicitVersion,
    };
  }

  const sha = readCommitSha(env);
  const date = readCommitDate(sha, now);

  return {
    source: sha ? "git" : "clock",
    version: buildDateVersion({ date, sha }),
  };
};
