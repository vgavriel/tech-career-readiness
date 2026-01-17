#!/usr/bin/env bash

port_in_use() {
  local port="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -n -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi

  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1
    return $?
  fi

  return 1
}
