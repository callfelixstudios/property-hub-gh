#!/usr/bin/env bash
OLD_EMAIL="felix@propertyhubgh.com"
NEW_NAME="callfelixstudios"
NEW_EMAIL="callfelixstudios@gmail.com"

# Use git filter-repo if available, otherwise fallback to filter-branch
if command -v git-filter-repo > /dev/null; then
  git filter-repo --replace-email "$OLD_EMAIL" "$NEW_EMAIL"
else
  git filter-branch --env-filter '
    if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]; then
      export GIT_AUTHOR_NAME="$NEW_NAME"
      export GIT_AUTHOR_EMAIL="$NEW_EMAIL"
    fi
    if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]; then
      export GIT_COMMITTER_NAME="$NEW_NAME"
      export GIT_COMMITTER_EMAIL="$NEW_EMAIL"
    fi
  ' -- --all
fi
