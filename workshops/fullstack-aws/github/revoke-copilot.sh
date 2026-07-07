#!/bin/bash

# Revoke GitHub Copilot seats for students being cleaned up.
# Skips rows where active=true — those students keep their Copilot seat.
#
# Requirements:
#   - GitHub CLI installed (https://cli.github.com/)
#   - Authenticated as an org owner with Copilot admin: `gh auth login`
#
# Usage:
#   ORG=becloudready ./revoke-copilot.sh github-roster.csv
#
# CSV format (header required): username,full_name,email,github_username,active
# Rows with active=true are skipped. Rows with active=false (or blank) are revoked.
#
# API ref: DELETE /orgs/{org}/copilot/billing/selected_users
#   body: {"selected_usernames": ["user1","user2",...]}

set -euo pipefail

ORG="${ORG:-becloudready}"
ROSTER="${1:-github-roster.csv}"

if [[ ! -f "$ROSTER" ]]; then
  echo "Roster not found: $ROSTER" >&2
  exit 1
fi

REVOKE_USERS=()
SKIPPED=()

while IFS=, read -r _username _full_name _email gh_user active _rest; do
  gh_user="${gh_user// }"
  active="${active// }"
  [[ -z "$gh_user" ]] && continue
  if [[ "$active" == "true" ]]; then
    SKIPPED+=("$gh_user")
  else
    REVOKE_USERS+=("$gh_user")
  fi
done < <(tail -n +2 "$ROSTER")

if [[ ${#SKIPPED[@]} -gt 0 ]]; then
  echo "Skipping (active=true): ${SKIPPED[*]}"
fi

if [[ ${#REVOKE_USERS[@]} -eq 0 ]]; then
  echo "No users to revoke."
  exit 0
fi

echo ""
echo "Revoking Copilot seats in $ORG for ${#REVOKE_USERS[@]} users:"
printf '  - %s\n' "${REVOKE_USERS[@]}"
echo

USERS_JSON=$(printf '%s\n' "${REVOKE_USERS[@]}" | jq -R . | jq -s .)

if gh api \
    --method DELETE \
    -H "Accept: application/vnd.github+json" \
    "/orgs/$ORG/copilot/billing/selected_users" \
    --input - <<EOF
{ "selected_usernames": $USERS_JSON }
EOF
then
  echo "✓ Copilot seat revocation submitted for ${#REVOKE_USERS[@]} users."
  echo "  Run \`gh api /orgs/$ORG/copilot/billing/seats\` to verify."
else
  echo "✗ Copilot seat revocation failed." >&2
  exit 1
fi
