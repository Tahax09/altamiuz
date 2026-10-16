#!/bin/sh
# Point git at the versioned hooks directory (no-op outside a git checkout).
if git rev-parse --git-dir >/dev/null 2>&1; then git config core.hooksPath .githooks; fi
