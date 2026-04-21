#!/bin/bash
# Hook: PostToolUse for Edit|Write on .tsx files
# Warns if a component file exceeds 200 lines
# Exit code 0 = proceed (warning only, doesn't block)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check .tsx files
if [[ "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

LINE_COUNT=$(wc -l < "$FILE_PATH" 2>/dev/null | tr -d ' ')

if [ -n "$LINE_COUNT" ] && [ "$LINE_COUNT" -gt 200 ]; then
  echo "Warning: $FILE_PATH is $LINE_COUNT lines (limit: 200). Consider splitting into smaller components." >&2
fi

exit 0
