#!/bin/bash

# Bulk-assign GitHub Copilot seats to students in the cohort.
#
# Requirements:
#   - GitHub CLI installed (https://cli.github.com/)
#   - Authenticated as an org owner with Copilot admin: `gh auth login`
#   - The org `$ORG` has a Copilot Business / Enterprise subscription with
#     seats available
#
# Usage:
#   ORG=becloudready ./invite-copilot.sh students.csv
#
# CSV format (header required): username,full_name,email,github_username
# We read column 4 (github_username).
#
# API ref: POST /orgs/{org}/copilot/billing/selected_users
#   body: {"selected_usernames": ["user1","user2",...]}

set -euo pipefail

ORG="${ORG:-becloudready}"
ROSTER="${1:-students.csv}"

if [[ ! -f "$ROSTER" ]]; then
  echo "Roster not found: $ROSTER" >&2
  exit 1
fi

# Collect github usernames (col 4), skip header + blanks.
USERS=()
while IFS=, read -r _username _full_name _email gh_user _rest; do
  [[ -z "${gh_user// }" ]] && continue
  USERS+=("$gh_user")
done < <(tail -n +2 "$ROSTER")

if [[ ${#USERS[@]} -eq 0 ]]; then
  echo "No GitHub usernames in $ROSTER" >&2
  exit 1
fi

echo "Assigning Copilot seats in $ORG to ${#USERS[@]} users..."
printf '  - %s\n' "${USERS[@]}"
echo

# Build the JSON array of usernames.
USERS_JSON=$(printf '%s\n' "${USERS[@]}" | jq -R . | jq -s .)

if gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    "/orgs/$ORG/copilot/billing/selected_users" \
    --input - <<EOF
{ "selected_usernames": $USERS_JSON }
EOF
then
  echo "✓ Copilot seat assignment request submitted."
  echo "  Run \`gh api /orgs/$ORG/copilot/billing/seats\` to verify."
else
  echo "✗ Copilot seat assignment failed." >&2
  exit 1
fi
