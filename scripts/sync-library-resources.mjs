#!/usr/bin/env node

/**
 * Copy the Career Exploration Library's resources into
 * src/lib/library-resources.json, so Google Analytics events for lessons and
 * lesson links carry the same pathway, field, and type values the library
 * sends for the same resource.
 *
 * Usage: node scripts/sync-library-resources.mjs [--file <library.json>]
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIBRARY_DATA_URL =
  "https://brown-career-center.github.io/career-exploration-library/data/library.json";
const OUTPUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/lib/library-resources.json"
);

/** The library's filter ids and the GA4 parameter names it sends them as. */
const FACET_PARAMS = [
  ["professional-pathway", "professional_pathway"],
  ["career-field", "career_field"],
  ["resource-type", "resource_type"],
];

const readLibrary = async () => {
  const fileIndex = process.argv.indexOf("--file");
  if (fileIndex !== -1) {
    return JSON.parse(await readFile(process.argv[fileIndex + 1], "utf8"));
  }

  const response = await fetch(LIBRARY_DATA_URL);
  if (!response.ok) {
    throw new Error(`Could not download ${LIBRARY_DATA_URL} (HTTP ${response.status}).`);
  }
  return response.json();
};

const isText = (value) => typeof value === "string" && value.length > 0 && value.length <= 500;

const isWebUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

/**
 * Keep only the fields analytics needs, and only when they have the expected
 * shape: the output is bundled into the app, so nothing else from the
 * downloaded file may reach it.
 */
const toEntry = (resource, index) => {
  if (!isText(resource?.title) || !isText(resource?.url) || !isWebUrl(resource.url)) {
    throw new Error(`Library resource ${index} has no usable title or http(s) link.`);
  }

  const entry = { title: resource.title, url: resource.url };
  for (const [facetId, param] of FACET_PARAMS) {
    const values = resource.facets?.[facetId] ?? [];
    if (!Array.isArray(values) || !values.every(isText)) {
      throw new Error(`Library resource ${index} has an invalid "${facetId}" value.`);
    }
    if (values.length > 0) {
      entry[param] = values.join(",");
    }
  }
  return entry;
};

const library = await readLibrary();

if (!Array.isArray(library?.resources) || library.resources.length === 0) {
  throw new Error("The library data has no resources.");
}

const resources = library.resources.map(toEntry);

await writeFile(
  OUTPUT_PATH,
  `${JSON.stringify({ source: LIBRARY_DATA_URL, resources }, null, 2)}\n`
);

console.log(
  `Wrote ${resources.length} library resources to ${path.relative(process.cwd(), OUTPUT_PATH)}.`
);
