#!/usr/bin/env bash
# Stress CPU on this EC2 instance to trigger a CloudWatch CPUUtilization alarm.
# Uses a Python3 tight spin loop — CPU bound, no installs required.
#
# Usage: ./cpu-load.sh [duration_seconds]
# Default: 300 seconds (5 minutes)

DURATION=${1:-300}
CPUS=$(nproc)

echo "Stressing $CPUS vCPU(s) for ${DURATION}s..."

for i in $(seq 1 "$CPUS"); do
  python3 -c "while True: pass" &
done

sleep "$DURATION"

kill $(jobs -p) 2>/dev/null
wait 2>/dev/null

echo "Done. CPU load stopped."
