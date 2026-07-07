#!/bin/bash
# Fully prepare active=false IAM users for deletion before running terraform apply.
# Removes all objects that block IAM user deletion:
#   access keys, login profile, MFA devices, group memberships,
#   signing certificates, SSH public keys, service-specific credentials.
#
# Usage:
#   ./pre-cleanup-access-keys.sh students.csv
#   ./pre-cleanup-access-keys.sh students-batch-b.csv

set -euo pipefail

ROSTER="${1:-students.csv}"

if [[ ! -f "$ROSTER" ]]; then
  echo "Roster not found: $ROSTER" >&2
  exit 1
fi

cleanup_user() {
  local username="$1"
  echo "--- $username ---"

  # Access keys
  keys=$(aws iam list-access-keys --user-name "$username" \
    --query 'AccessKeyMetadata[].AccessKeyId' --output text 2>/dev/null || true)
  for key_id in $keys; do
    [[ -z "$key_id" ]] && continue
    aws iam delete-access-key --user-name "$username" --access-key-id "$key_id"
    echo "  deleted access key $key_id"
  done

  # Login profile
  if aws iam get-login-profile --user-name "$username" &>/dev/null; then
    aws iam delete-login-profile --user-name "$username"
    echo "  deleted login profile"
  fi

  # MFA devices
  mfa_serials=$(aws iam list-mfa-devices --user-name "$username" \
    --query 'MFADevices[].SerialNumber' --output text 2>/dev/null || true)
  for serial in $mfa_serials; do
    [[ -z "$serial" ]] && continue
    aws iam deactivate-mfa-device --user-name "$username" --serial-number "$serial"
    # Virtual MFA devices must also be deleted separately
    if [[ "$serial" == arn:aws:iam::*:mfa/* ]]; then
      aws iam delete-virtual-mfa-device --serial-number "$serial" 2>/dev/null || true
    fi
    echo "  removed MFA device $serial"
  done

  # Group memberships
  groups=$(aws iam list-groups-for-user --user-name "$username" \
    --query 'Groups[].GroupName' --output text 2>/dev/null || true)
  for group in $groups; do
    [[ -z "$group" ]] && continue
    aws iam remove-user-from-group --user-name "$username" --group-name "$group"
    echo "  removed from group $group"
  done

  # Signing certificates
  certs=$(aws iam list-signing-certificates --user-name "$username" \
    --query 'Certificates[].CertificateId' --output text 2>/dev/null || true)
  for cert_id in $certs; do
    [[ -z "$cert_id" ]] && continue
    aws iam delete-signing-certificate --user-name "$username" --certificate-id "$cert_id"
    echo "  deleted signing certificate $cert_id"
  done

  # SSH public keys
  ssh_keys=$(aws iam list-ssh-public-keys --user-name "$username" \
    --query 'SSHPublicKeys[].SSHPublicKeyId' --output text 2>/dev/null || true)
  for key_id in $ssh_keys; do
    [[ -z "$key_id" ]] && continue
    aws iam delete-ssh-public-key --user-name "$username" --ssh-public-key-id "$key_id"
    echo "  deleted SSH public key $key_id"
  done

  # Service-specific credentials
  svc_creds=$(aws iam list-service-specific-credentials --user-name "$username" \
    --query 'ServiceSpecificCredentials[].ServiceSpecificCredentialId' --output text 2>/dev/null || true)
  for cred_id in $svc_creds; do
    [[ -z "$cred_id" ]] && continue
    aws iam delete-service-specific-credential --user-name "$username" --service-specific-credential-id "$cred_id"
    echo "  deleted service-specific credential $cred_id"
  done

  # Attached user policies
  policies=$(aws iam list-attached-user-policies --user-name "$username" \
    --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || true)
  for policy_arn in $policies; do
    [[ -z "$policy_arn" ]] && continue
    aws iam detach-user-policy --user-name "$username" --policy-arn "$policy_arn"
    echo "  detached policy $policy_arn"
  done

  # Inline user policies
  inline_policies=$(aws iam list-user-policies --user-name "$username" \
    --query 'PolicyNames[]' --output text 2>/dev/null || true)
  for policy_name in $inline_policies; do
    [[ -z "$policy_name" ]] && continue
    aws iam delete-user-policy --user-name "$username" --policy-name "$policy_name"
    echo "  deleted inline policy $policy_name"
  done

  echo "  ready for deletion"
}

PROCESSED=0
SKIPPED=0

while IFS=, read -r username _ _ active _rest; do
  [[ "$username" == "username" ]] && continue
  username="${username// }"
  active="${active// }"
  if [[ "$active" == "true" ]]; then
    echo "Skipping $username (active=true)"
    ((SKIPPED++))
    continue
  fi
  cleanup_user "$username"
  ((PROCESSED++))
done < "$ROSTER"

echo ""
echo "===== Summary ====="
echo "Processed (active=false): $PROCESSED"
echo "Skipped   (active=true):  $SKIPPED"
echo ""
echo "Now run: terraform apply -var=roster_csv=$ROSTER"
