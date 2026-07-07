#!/bin/bash

# Remove students from the cohort team in the GitHub org.
# Skips rows where active=true — those students keep their access.
#
# Requirements:
#   - GitHub CLI installed (https://cli.github.com/)
#   - Authenticated as an org owner: `gh auth login`
#
# Usage:
#   ORG=becloudready TEAM_SLUG=fullstack-cohort-01 ./remove-team-members.sh github-roster.csv
#
# CSV format (header required): username,full_name,email,github_username,active
# Rows with active=true are skipped. Rows with active=false (or blank) are removed.

set -euo pipefail

ORG="${ORG:-becloudready}"
TEAM_SLUG="${TEAM_SLUG:-fullstack-cohort-01}"
ROSTER="${1:-github-roster.csv}"

if [[ ! -f "$ROSTER" ]]; then
  echo "Roster not found: $ROSTER" >&2
  exit 1
fi

SUCCESS=0
SKIPPED=0
FAILED=0
FAILED_USERS=()

while IFS=, read -r _username _full_name _email gh_user active _rest; do
  gh_user="${gh_user// }"
  active="${active// }"
  [[ -z "$gh_user" ]] && continue
  if [[ "$active" == "true" ]]; then
    echo "Skipping $gh_user (active=true)"
    ((SKIPPED++))
    continue
  fi

  echo "Removing $gh_user from $ORG/$TEAM_SLUG..."
  if gh api \
      --method DELETE \
      -H "Accept: application/vnd.github+json" \
      "/orgs/$ORG/teams/$TEAM_SLUG/memberships/$gh_user" \
      --silent 2>/dev/null; then
    echo "  ✓ $gh_user removed"
    ((SUCCESS++))
  else
    echo "  ✗ Failed to remove $gh_user (may already be gone)"
    FAILED_USERS+=("$gh_user")
    ((FAILED++))
  fi
  sleep 0.5
done < <(tail -n +2 "$ROSTER")

echo ""
echo "===== Summary ====="
echo "Removed:  $SUCCESS"
echo "Skipped (active=true): $SKIPPED"
echo "Failed:   $FAILED"
if [[ ${#FAILED_USERS[@]} -gt 0 ]]; then
  echo "Failed users:"
  printf '  - %s\n' "${FAILED_USERS[@]}"
fi
