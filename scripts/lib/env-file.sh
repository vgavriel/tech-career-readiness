#!/usr/bin/env bash

read_env_value() {
  local env_path="$1"
  local key="$2"

  node - "$env_path" "$key" <<'NODE'
const fs = require("fs");
const [,, envPath, key] = process.argv;
if (!fs.existsSync(envPath)) {
  process.exit(1);
}
const contents = fs.readFileSync(envPath, "utf8");
const match = contents.match(new RegExp(`^${key}=(.*)$`, "m"));
if (!match) {
  process.exit(1);
}
let value = match[1].trim();
if (
  (value.startsWith('"') && value.endsWith('"')) ||
  (value.startsWith("'") && value.endsWith("'"))
) {
  value = value.slice(1, -1);
}
process.stdout.write(value);
NODE
}

write_env_value() {
  local env_path="$1"
  local key="$2"
  local value="$3"

  node - "$env_path" "$key" "$value" <<'NODE'
const fs = require("fs");
const [,, envPath, key, value] = process.argv;
const escapedValue = value.replace(/"/g, '\\"');
const line = `${key}="${escapedValue}"`;
let contents = "";
if (fs.existsSync(envPath)) {
  contents = fs.readFileSync(envPath, "utf8");
}
const regex = new RegExp(`^${key}=.*$`, "m");
if (regex.test(contents)) {
  contents = contents.replace(regex, line);
} else {
  if (contents.length && !contents.endsWith("\n")) {
    contents += "\n";
  }
  contents += `${line}\n`;
}
fs.writeFileSync(envPath, contents);
NODE
}

ensure_env_file() {
  local env_path="$1"
  local example_path="$2"

  if [[ ! -f "$example_path" ]]; then
    echo "Missing ${example_path}. Check your repo contents." >&2
    exit 1
  fi

  if [[ ! -f "$env_path" ]]; then
    cp "$example_path" "$env_path"
    echo "Created $(basename "$env_path") from $(basename "$example_path")"
  fi
}
