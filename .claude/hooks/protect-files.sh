#!/bin/bash
# Hook: PreToolUse for Write|Edit
# Blocks edits to sensitive files (env, lock files, etc.)
# Exit code 2 = block the operation

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

PROTECTED_PATTERNS=(".env" "package-lock.json" ".git/" "secrets" "credentials")

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: cannot edit '$FILE_PATH' (matches protected pattern '$pattern')" >&2
    exit 2
  fi
done

exit 0
