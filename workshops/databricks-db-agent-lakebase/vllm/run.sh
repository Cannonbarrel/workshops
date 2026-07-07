#!/usr/bin/env bash
# Start the vLLM OpenAI-compatible server.
#
# Host requirements: NVIDIA driver + nvidia-container-toolkit installed and working
# (verify with `docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi`).
#
# Usage:
#   ./run.sh                                       # uses config.yaml defaults
#   MODEL=mistralai/Mistral-7B-Instruct-v0.3 ./run.sh
#   PORT=8001 BUILD=0 ./run.sh                     # skip rebuild, run on a different port

set -euo pipefail

IMAGE=${IMAGE:-db-agent-vllm:latest}
MODEL=${MODEL:-}                       # if set, overrides config.yaml `model:`
PORT=${PORT:-8000}
HF_CACHE=${HF_CACHE:-$HOME/.cache/huggingface}

HERE="$(cd "$(dirname "$0")" && pwd)"

if [[ "${BUILD:-1}" == "1" ]]; then
  echo ">> building $IMAGE"
  docker build -t "$IMAGE" "$HERE"
fi

# Pass HF_TOKEN through if set (gated models like Llama need it).
ENV_ARGS=()
if [[ -n "${HF_TOKEN:-}" ]]; then
  ENV_ARGS+=(-e "HF_TOKEN=$HF_TOKEN")
fi

# Optional model override appended after the baked-in --config.
MODEL_ARGS=()
if [[ -n "$MODEL" ]]; then
  MODEL_ARGS+=(--model "$MODEL")
fi

echo ">> starting vLLM on host port $PORT"
exec docker run --rm -it \
  --gpus all \
  --shm-size=8g \
  -p "${PORT}:8000" \
  -v "${HF_CACHE}:/root/.cache/huggingface" \
  "${ENV_ARGS[@]}" \
  "$IMAGE" \
  --config /etc/vllm/config.yaml \
  "${MODEL_ARGS[@]}"
