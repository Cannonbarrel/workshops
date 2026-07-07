#!/bin/bash

# Bulk add students to the cohort team in the GitHub org.
#
# Requirements:
#   - GitHub CLI installed (https://cli.github.com/)
#   - Authenticated as an org owner: `gh auth login`
#   - The team `$TEAM_SLUG` already exists in `$ORG`
#
# Usage:
#   ORG=becloudready TEAM_SLUG=fullstack-cohort-01 ./add-team-members.sh students.csv
#
# CSV format (header required): username,full_name,email,github_username
# We read column 4 (github_username).

set -euo pipefail

ORG="${ORG:-becloudready}"
TEAM_SLUG="${TEAM_SLUG:-fullstack-cohort-01}"
ROLE="${ROLE:-member}"   # "maintainer" to make them team maintainers
ROSTER="${1:-students.csv}"

if [[ ! -f "$ROSTER" ]]; then
  echo "Roster not found: $ROSTER" >&2
  exit 1
fi

SUCCESS=0
FAILED=0
FAILED_USERS=()

# Skip header, skip blanks, pull column 4 (github_username)
while IFS=, read -r _username _full_name _email gh_user _rest; do
  [[ -z "${gh_user// }" ]] && continue

  echo "Adding $gh_user to $ORG/$TEAM_SLUG..."
  if gh api \
      --method PUT \
      -H "Accept: application/vnd.github+json" \
      "/orgs/$ORG/teams/$TEAM_SLUG/memberships/$gh_user" \
      -f "role=$ROLE" \
      --silent 2>/dev/null; then
    echo "  ✓ $gh_user added/invited"
    ((SUCCESS++))
  else
    echo "  ✗ Failed to add $gh_user"
    FAILED_USERS+=("$gh_user")
    ((FAILED++))
  fi
  sleep 0.5  # avoid rate limiting
done < <(tail -n +2 "$ROSTER")

echo ""
echo "===== Summary ====="
echo "Success: $SUCCESS"
echo "Failed:  $FAILED"
if [[ ${#FAILED_USERS[@]} -gt 0 ]]; then
  echo "Failed users:"
  printf '  - %s\n' "${FAILED_USERS[@]}"
fi
