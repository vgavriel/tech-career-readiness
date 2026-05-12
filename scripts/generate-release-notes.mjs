#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const RELEASE_TYPES = new Set([
  "user-facing",
  "fix",
  "accessibility",
  "performance",
  "security",
  "dependency",
  "internal",
  "none",
]);

const RELEASE_TYPE_ALIASES = new Map([
  ["a11y", "accessibility"],
  ["dependencies", "dependency"],
  ["deps", "dependency"],
  ["no-release-notes", "none"],
  ["no release notes", "none"],
  ["not user-facing", "internal"],
]);

const RELEASE_LABELS = new Map(Array.from(RELEASE_TYPES, (type) => [`release:${type}`, type]));

const USER_FACING_TYPES = new Set(["user-facing", "fix", "accessibility", "performance"]);
const SECURITY_TYPES = new Set(["security"]);
const DEPENDENCY_TYPES = new Set(["dependency"]);

const NONE_VALUES = new Set(["none", "n/a", "na", "no", "no release notes"]);

export const parseReleaseNoteArgs = (argv) => {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    options[key] = value;
    index += 1;
  }

  return options;
};

const normalizeWhitespace = (value) => value.replace(/\s+/g, " ").trim();

const normalizeReleaseType = (value) => {
  const normalized = normalizeWhitespace(String(value ?? "").toLowerCase());
  const aliased = RELEASE_TYPE_ALIASES.get(normalized) ?? normalized;
  return RELEASE_TYPES.has(aliased) ? aliased : null;
};

const normalizeLabels = (labels = []) =>
  labels.map((label) => {
    if (typeof label === "string") {
      return label.toLowerCase();
    }
    return String(label?.name ?? "").toLowerCase();
  });

const parseInlineField = (body, field) => {
  const pattern = new RegExp(`^\\s*${field}\\s*:\\s*(.+?)\\s*$`, "im");
  return body.match(pattern)?.[1]?.trim() ?? null;
};

const parseHeadingField = (body, heading) => {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const headingPattern = new RegExp(`^#{2,6}\\s+${heading}\\s*$`, "i");

  for (let index = 0; index < lines.length; index += 1) {
    if (!headingPattern.test(lines[index])) {
      continue;
    }

    const values = [];
    for (let valueIndex = index + 1; valueIndex < lines.length; valueIndex += 1) {
      const line = lines[valueIndex];
      if (/^#{2,6}\s+/.test(line)) {
        break;
      }
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("<!--")) {
        values.push(trimmed);
      }
    }

    return values.join(" ").trim() || null;
  }

  return null;
};

export const parseReleaseFields = (body = "") => {
  const releaseType = parseInlineField(body, "Release type");
  const releaseNote =
    parseInlineField(body, "Release note") ?? parseHeadingField(body, "Release note");

  return {
    releaseNote: releaseNote ? normalizeWhitespace(releaseNote) : null,
    releaseType: releaseType ? normalizeReleaseType(releaseType) : null,
  };
};

export const classifyPullRequest = (pr) => {
  const labels = normalizeLabels(pr.labels);
  const labelType = labels.map((label) => RELEASE_LABELS.get(label)).find(Boolean);
  if (labelType) {
    return labelType;
  }

  const fields = parseReleaseFields(pr.body);
  if (fields.releaseType) {
    return fields.releaseType;
  }

  if (pr.author?.toLowerCase?.() === "renovate[bot]" || labels.includes("dependencies")) {
    return "dependency";
  }

  return "internal";
};

const hasReleaseNote = (note) => {
  if (!note) {
    return false;
  }
  return !NONE_VALUES.has(note.toLowerCase());
};

export const summarizePullRequest = (pr) => {
  const fields = parseReleaseFields(pr.body);
  const type = classifyPullRequest(pr);
  const note = hasReleaseNote(fields.releaseNote) ? fields.releaseNote : pr.title;

  return {
    number: pr.number,
    title: pr.title,
    type,
    note,
    url: pr.url,
  };
};

const formatPrLine = (entry) => {
  const suffix = entry.url ? ` ([#${entry.number}](${entry.url}))` : ` (#${entry.number})`;
  return `- ${entry.note}${suffix}`;
};

const section = (title, entries) => {
  if (entries.length === 0) {
    return "";
  }

  return [`## ${title}`, ...entries.map(formatPrLine), ""].join("\n");
};

export const formatReleaseNotes = ({
  directCommits = [],
  generatedAt = new Date(),
  headSha,
  previousTag,
  pullRequests = [],
  tag,
  version,
}) => {
  const entries = pullRequests.map(summarizePullRequest);
  const userFacing = entries.filter((entry) => USER_FACING_TYPES.has(entry.type));
  const security = entries.filter((entry) => SECURITY_TYPES.has(entry.type));
  const dependencies = entries.filter((entry) => DEPENDENCY_TYPES.has(entry.type));
  const internal = entries.filter(
    (entry) =>
      !USER_FACING_TYPES.has(entry.type) &&
      !SECURITY_TYPES.has(entry.type) &&
      !DEPENDENCY_TYPES.has(entry.type)
  );

  const parts = [
    `# ${tag}`,
    "",
    `Automated production version ${version}.`,
    "",
    "## Deployment",
    `- Commit: \`${headSha}\``,
    `- Previous version: ${previousTag ? `\`${previousTag}\`` : "Initial release"}`,
    `- Generated: ${generatedAt.toISOString()}`,
    "",
    section("User-Facing Changes", userFacing),
    section("Security", security),
    section("Dependency Maintenance", dependencies),
    section("Internal Changes", internal),
  ].filter(Boolean);

  if (directCommits.length > 0) {
    parts.push(
      "## Direct Commits",
      ...directCommits.map((commit) => `- ${commit.subject} (\`${commit.sha.slice(0, 7)}\`)`),
      ""
    );
  }

  if (entries.length === 0 && directCommits.length === 0) {
    parts.push("## Changes", "No pull requests or direct commits were found for this range.", "");
  }

  return `${parts.join("\n").trim()}\n`;
};

const git = (args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

export const listCommitShas = ({ from, to }) => {
  const range = from ? `${from}..${to}` : to;
  const output = git(["log", "--format=%H", "--reverse", range]);
  return output ? output.split("\n") : [];
};

export const readCommitSubject = (sha) => git(["show", "-s", "--format=%s", sha]);

export const githubRequest = async ({ fetchImpl = fetch, path, repo, token }) => {
  const response = await fetchImpl(`https://api.github.com/repos/${repo}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}) for ${path}`);
  }

  return response.json();
};

export const fetchAssociatedPullRequests = async ({
  repo,
  request = githubRequest,
  sha,
  token,
}) => {
  const pulls = await request({
    path: `/commits/${sha}/pulls`,
    repo,
    token,
  });

  return pulls
    .filter((pull) => pull.merged_at)
    .map((pull) => ({
      author: pull.user?.login ?? null,
      body: pull.body ?? "",
      labels: pull.labels ?? [],
      number: pull.number,
      title: pull.title,
      url: pull.html_url,
    }));
};

export const collectReleaseChanges = async ({
  fetchPullRequests = fetchAssociatedPullRequests,
  from,
  listCommits = listCommitShas,
  readSubject = readCommitSubject,
  repo,
  token,
  to,
}) => {
  const commits = listCommits({ from, to });
  const pullRequestsByNumber = new Map();
  const directCommits = [];

  for (const sha of commits) {
    const pullRequests = await fetchPullRequests({ repo, sha, token });
    if (pullRequests.length === 0) {
      directCommits.push({
        sha,
        subject: readSubject(sha),
      });
      continue;
    }

    for (const pullRequest of pullRequests) {
      pullRequestsByNumber.set(pullRequest.number, pullRequest);
    }
  }

  return {
    directCommits,
    pullRequests: Array.from(pullRequestsByNumber.values()).sort((a, b) => a.number - b.number),
  };
};

export const runReleaseNoteGenerator = async ({
  collectChanges = collectReleaseChanges,
  env = process.env,
  generatedAt = new Date(),
  options,
  stdout = process.stdout,
  writeFile = writeFileSync,
}) => {
  const repo = options.repo ?? env.GITHUB_REPOSITORY;
  const token = options.token ?? env.GITHUB_TOKEN;
  const to = options.to ?? env.GITHUB_SHA;
  const tag = options.tag;
  const version = options.version ?? tag?.replace(/^v/, "");

  if (!repo) {
    throw new Error("Missing --repo or GITHUB_REPOSITORY.");
  }
  if (!token) {
    throw new Error("Missing --token or GITHUB_TOKEN.");
  }
  if (!to) {
    throw new Error("Missing --to or GITHUB_SHA.");
  }
  if (!tag) {
    throw new Error("Missing --tag.");
  }
  if (!version) {
    throw new Error("Missing --version.");
  }

  const changes = await collectChanges({
    from: options.from,
    repo,
    token,
    to,
  });
  const notes = formatReleaseNotes({
    ...changes,
    headSha: to,
    previousTag: options.from,
    tag,
    version,
    generatedAt,
  });

  if (options.output) {
    writeFile(options.output, notes, "utf8");
    return;
  }

  stdout.write(notes);
};

const main = async () => {
  await runReleaseNoteGenerator({
    options: parseReleaseNoteArgs(process.argv.slice(2)),
  });
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
