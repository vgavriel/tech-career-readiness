import { describe, expect, it, vi } from "vitest";

import {
  classifyPullRequest,
  collectReleaseChanges,
  fetchAssociatedPullRequests,
  formatReleaseNotes,
  githubRequest,
  listCommitShas,
  parseReleaseFields,
  parseReleaseNoteArgs,
  readCommitSubject,
  runReleaseNoteGenerator,
  summarizePullRequest,
} from "../generate-release-notes.mjs";

describe("release note generation", () => {
  it("parses release metadata from the PR template block", () => {
    const body = [
      "## Summary",
      "- Added loading feedback.",
      "",
      "## Release",
      "Release type: user-facing",
      "Release note: Lesson pages now show loading feedback while content loads.",
    ].join("\n");

    expect(parseReleaseFields(body)).toEqual({
      releaseNote: "Lesson pages now show loading feedback while content loads.",
      releaseType: "user-facing",
    });
  });

  it("parses a standalone release note heading", () => {
    const body = ["## Release note", "", "None", "", "## Validation", "- npm test"].join("\n");

    expect(parseReleaseFields(body)).toEqual({
      releaseNote: "None",
      releaseType: null,
    });
  });

  it("classifies Renovate pull requests as dependency maintenance", () => {
    expect(
      classifyPullRequest({
        author: "renovate[bot]",
        body: "",
        labels: [],
      })
    ).toBe("dependency");
  });

  it("allows release labels to override body metadata", () => {
    expect(
      classifyPullRequest({
        author: "vgavriel",
        body: "Release type: internal",
        labels: [{ name: "release:security" }],
      })
    ).toBe("security");
  });

  it("uses the release note when one is provided", () => {
    expect(
      summarizePullRequest({
        author: "vgavriel",
        body: "Release type: fix\nRelease note: Tables now keep their column divider centered.",
        labels: [],
        number: 193,
        title: "Improve lesson tables",
        url: "https://github.com/example/repo/pull/193",
      })
    ).toEqual({
      note: "Tables now keep their column divider centered.",
      number: 193,
      title: "Improve lesson tables",
      type: "fix",
      url: "https://github.com/example/repo/pull/193",
    });
  });

  it("formats grouped release notes for user-facing, dependency, and direct changes", () => {
    const notes = formatReleaseNotes({
      directCommits: [{ sha: "abcdef0123456789", subject: "Tweak repository metadata" }],
      generatedAt: new Date("2026-05-12T12:00:00.000Z"),
      headSha: "abcdef0123456789abcdef0123456789abcdef01",
      previousTag: "v2026.05.11.1234567",
      pullRequests: [
        {
          author: "vgavriel",
          body: "Release type: user-facing\nRelease note: Lessons show progress while loading.",
          labels: [],
          number: 200,
          title: "Add lesson loading indicator",
          url: "https://github.com/example/repo/pull/200",
        },
        {
          author: "renovate[bot]",
          body: "",
          labels: [],
          number: 201,
          title: "Update dependency next to v16.2.6",
          url: "https://github.com/example/repo/pull/201",
        },
      ],
      tag: "v2026.05.12.abcdef0",
      version: "2026.05.12.abcdef0",
    });

    expect(notes).toContain("# v2026.05.12.abcdef0");
    expect(notes).toContain("## User-Facing Changes");
    expect(notes).toContain(
      "- Lessons show progress while loading. ([#200](https://github.com/example/repo/pull/200))"
    );
    expect(notes).toContain("## Dependency Maintenance");
    expect(notes).toContain(
      "- Update dependency next to v16.2.6 ([#201](https://github.com/example/repo/pull/201))"
    );
    expect(notes).toContain("## Direct Commits");
    expect(notes).toContain("- Tweak repository metadata (`abcdef0`)");
  });

  it("formats an initial release with no associated changes", () => {
    const notes = formatReleaseNotes({
      generatedAt: new Date("2026-05-12T12:00:00.000Z"),
      headSha: "abcdef0123456789abcdef0123456789abcdef01",
      pullRequests: [],
      tag: "v2026.05.12.abcdef0",
      version: "2026.05.12.abcdef0",
    });

    expect(notes).toContain("- Previous version: Initial release");
    expect(notes).toContain("No pull requests or direct commits were found for this range.");
  });

  it("parses CLI-style options", () => {
    expect(
      parseReleaseNoteArgs([
        "--repo",
        "example/repo",
        "--tag",
        "v2026.05.12.abcdef0",
        "--output",
        "release-notes.md",
      ])
    ).toEqual({
      output: "release-notes.md",
      repo: "example/repo",
      tag: "v2026.05.12.abcdef0",
    });
  });

  it("rejects malformed CLI-style options", () => {
    expect(() => parseReleaseNoteArgs(["repo"])).toThrow("Unexpected argument: repo");
    expect(() => parseReleaseNoteArgs(["--repo"])).toThrow("Missing value for --repo");
  });

  it("calls the GitHub API with release-note headers", async () => {
    const json = async () => [{ number: 1 }];
    const fetchImpl = vi.fn(async () => ({
      json,
      ok: true,
    }));

    await expect(
      githubRequest({
        fetchImpl,
        path: "/commits/abc/pulls",
        repo: "example/repo",
        token: "token",
      })
    ).resolves.toEqual([{ number: 1 }]);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/example/repo/commits/abc/pulls",
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: "Bearer token",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
  });

  it("throws when the GitHub API request fails", async () => {
    await expect(
      githubRequest({
        fetchImpl: async () => ({
          ok: false,
          status: 403,
        }),
        path: "/commits/abc/pulls",
        repo: "example/repo",
        token: "token",
      })
    ).rejects.toThrow("GitHub API request failed (403) for /commits/abc/pulls");
  });

  it("uses global fetch by default for GitHub API requests", async () => {
    const originalFetch = globalThis.fetch;
    const fetchImpl = vi.fn(async () => ({
      json: async () => [],
      ok: true,
    }));
    globalThis.fetch = fetchImpl;

    try {
      await githubRequest({
        path: "/commits/abc/pulls",
        repo: "example/repo",
        token: "token",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("normalizes associated pull requests from GitHub commit responses", async () => {
    await expect(
      fetchAssociatedPullRequests({
        repo: "example/repo",
        request: async () => [
          {
            body: "Release type: security",
            html_url: "https://github.com/example/repo/pull/10",
            labels: [{ name: "release:security" }],
            merged_at: "2026-05-12T12:00:00Z",
            number: 10,
            title: "Patch auth callback",
            user: { login: "vgavriel" },
          },
          {
            merged_at: null,
            number: 11,
          },
        ],
        sha: "abcdef0",
        token: "token",
      })
    ).resolves.toEqual([
      {
        author: "vgavriel",
        body: "Release type: security",
        labels: [{ name: "release:security" }],
        number: 10,
        title: "Patch auth callback",
        url: "https://github.com/example/repo/pull/10",
      },
    ]);
  });

  it("collects unique PRs and direct commits for a release range", async () => {
    const changes = await collectReleaseChanges({
      fetchPullRequests: async ({ sha }) => {
        if (sha === "commit-a") {
          return [
            {
              author: "vgavriel",
              body: "",
              labels: [],
              number: 2,
              title: "Add release notes",
              url: "https://github.com/example/repo/pull/2",
            },
          ];
        }
        if (sha === "commit-b") {
          return [
            {
              author: "vgavriel",
              body: "",
              labels: [],
              number: 2,
              title: "Add release notes",
              url: "https://github.com/example/repo/pull/2",
            },
            {
              author: "renovate[bot]",
              body: "",
              labels: [],
              number: 3,
              title: "Update dependency",
              url: "https://github.com/example/repo/pull/3",
            },
          ];
        }
        return [];
      },
      listCommits: () => ["commit-a", "commit-b", "commit-c"],
      readSubject: (sha) => `Subject for ${sha}`,
      repo: "example/repo",
      token: "token",
      to: "commit-c",
    });

    expect(changes).toEqual({
      directCommits: [{ sha: "commit-c", subject: "Subject for commit-c" }],
      pullRequests: [
        {
          author: "vgavriel",
          body: "",
          labels: [],
          number: 2,
          title: "Add release notes",
          url: "https://github.com/example/repo/pull/2",
        },
        {
          author: "renovate[bot]",
          body: "",
          labels: [],
          number: 3,
          title: "Update dependency",
          url: "https://github.com/example/repo/pull/3",
        },
      ],
    });
  });

  it("can read commit ranges and subjects from the local Git checkout", () => {
    expect(listCommitShas({ from: "HEAD", to: "HEAD" })).toEqual([]);
    expect(readCommitSubject("HEAD")).toEqual(expect.any(String));
  });

  it("writes generated release notes to a file when output is set", async () => {
    const writeFile = vi.fn();

    await runReleaseNoteGenerator({
      collectChanges: async () => ({
        directCommits: [],
        pullRequests: [],
      }),
      env: {
        GITHUB_REPOSITORY: "example/repo",
        GITHUB_SHA: "abcdef0123456789",
        GITHUB_TOKEN: "token",
      },
      generatedAt: new Date("2026-05-12T12:00:00.000Z"),
      options: {
        output: "release-notes.md",
        tag: "v2026.05.12.abcdef0",
      },
      writeFile,
    });

    expect(writeFile).toHaveBeenCalledWith(
      "release-notes.md",
      expect.stringContaining("# v2026.05.12.abcdef0"),
      "utf8"
    );
  });

  it("writes generated release notes to stdout when no output is set", async () => {
    const stdout = { write: vi.fn() };

    await runReleaseNoteGenerator({
      collectChanges: async () => ({
        directCommits: [],
        pullRequests: [],
      }),
      env: {
        GITHUB_REPOSITORY: "example/repo",
        GITHUB_SHA: "abcdef0123456789",
        GITHUB_TOKEN: "token",
      },
      generatedAt: new Date("2026-05-12T12:00:00.000Z"),
      options: {
        tag: "v2026.05.12.abcdef0",
      },
      stdout,
    });

    expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining("# v2026.05.12.abcdef0"));
  });

  it("requires enough context to generate notes", async () => {
    await expect(
      runReleaseNoteGenerator({
        options: {
          tag: "v2026.05.12.abcdef0",
        },
        env: {},
      })
    ).rejects.toThrow("Missing --repo or GITHUB_REPOSITORY.");
  });
});
