#!/bin/bash
# Hook: PostToolUse for Edit|Write on .ts/.tsx files
# Runs TypeScript type-check after editing TypeScript files
# Exit code 0 = proceed, non-zero output shown as warning

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check TypeScript files
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Run tsc in the project directory, suppress success output
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0
ERRORS=$(npx tsc --noEmit 2>&1)

if [ $? -ne 0 ]; then
  echo "TypeScript errors after editing $FILE_PATH:" >&2
  echo "$ERRORS" | head -20 >&2
fi

exit 0
