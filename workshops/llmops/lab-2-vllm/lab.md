# Lab 2 — Deploy vLLM

**Duration:** ~60 minutes  
**Goal:** Deploy the Qwen3-0.6B model using vLLM's OpenAI-compatible inference
server. Test the API, understand the key serving parameters, and verify that vLLM's
built-in Prometheus metrics endpoint is working.

**Prerequisites:** Lab 1 complete — Docker + NVIDIA runtime installed, `llmops-net`
network exists.

---

## Part 1 — HuggingFace Token

vLLM downloads models from HuggingFace on first run. You need a read token.

On your local machine:
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click **New token** → Role: **Read** → copy the token

On your GPU VM:

```bash
export HF_TOKEN="hf_your_token_here"
```

Add it to your shell profile so it persists across reconnects:

```bash
echo 'export HF_TOKEN="hf_your_token_here"' >> ~/.bashrc
```

---

## Part 2 — Deploy vLLM

Copy the workshop files to your VM, or clone the workshops repo:

```bash
cd ~
git clone https://github.com/becloudready/workshops.git
cd workshops/workshops/llmops/lab-2-vllm
```

Start vLLM:

```bash
docker compose up -d
```

Watch the startup logs:

```bash
docker logs -f vllm
```

vLLM needs to:
1. Download the model weights from HuggingFace (~1.5 GB for Qwen3-0.6B)
2. Load the model onto the GPU
3. Start the HTTP server

**First-run download takes 2–5 minutes depending on network.** Subsequent starts are
near-instant (weights are cached in `~/.cache/huggingface`).

Look for this line to know it is ready:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## Part 3 — Test the API

### Health check

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

### List available models

```bash
curl http://localhost:8000/v1/models | python3 -m json.tool
```

You should see `Qwen/Qwen3-0.6B` in the model list.

### Send a chat completion

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3-0.6B",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant. Keep answers concise."},
      {"role": "user", "content": "Explain KV cache in LLM inference in 2 sentences."}
    ],
    "max_tokens": 128,
    "temperature": 0.2
  }' | python3 -m json.tool
```

Look at the response — note the `usage` field:

```json
"usage": {
  "prompt_tokens": 47,
  "completion_tokens": 58,
  "total_tokens": 105
}
```

### Streaming response

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3-0.6B",
    "messages": [{"role": "user", "content": "Count from 1 to 10 slowly."}],
    "max_tokens": 64,
    "stream": true
  }'
```

Watch tokens arrive one by one. This is what a production chat UI receives — each
`data: {...}` line is a Server-Sent Event with the next token.

---

## Part 4 — Inspect the Metrics Endpoint

vLLM exposes Prometheus metrics at `/metrics`:

```bash
curl http://localhost:8000/metrics | grep -E "^(vllm|# HELP vllm)" | head -40
```

Key metrics to note:

| Metric | What it measures |
|--------|-----------------|
| `vllm:e2e_request_latency_seconds` | End-to-end latency per request (histogram) |
| `vllm:time_to_first_token_seconds` | TTFT — time from request receipt to first token |
| `vllm:time_per_output_token_seconds` | TBT — inter-token latency (decode speed) |
| `vllm:num_requests_running` | Requests currently being processed |
| `vllm:num_requests_waiting` | Requests queued (KV cache full) |
| `vllm:gpu_cache_usage_perc` | Fraction of KV cache in use |
| `vllm:prompt_tokens_total` | Total input tokens processed |
| `vllm:generation_tokens_total` | Total output tokens generated |

Right now most counters are zero or near-zero because you've only sent a few
requests. Lab 3 will generate real load so you can watch these move.

---

## Part 5 — Key Serving Parameters

Review `docker-compose.yml`. The vLLM command arguments explain why each exists:

| Parameter | Value | Why |
|-----------|-------|-----|
| `--model` | `Qwen/Qwen3-0.6B` | Model to load |
| `--dtype` | `float16` | Half-precision — uses half the VRAM vs float32 |
| `--gpu-memory-utilization` | `0.92` | Fraction of GPU VRAM reserved for the KV cache. Higher = more concurrent requests. Don't set above 0.95 (risks OOM). |
| `--max-model-len` | `2048` | Maximum context window (input + output). Longer = more KV cache per request. |
| `--max-num-seqs` | `256` | Maximum number of requests in the batch at once |
| `--max-num-batched-tokens` | `65536` | Maximum tokens across all requests in one forward pass |
| `--enable-prefix-caching` | — | Reuses KV cache for repeated prompt prefixes (big win for chat templates and system prompts) |
| `--disable-log-requests` | — | Prevents per-request logging noise (use metrics instead) |

**Exercise:** Change `--gpu-memory-utilization` to `0.5`, restart, and re-run a chat
request. Notice the reduced memory used:

```bash
# While vLLM is running:
nvidia-smi | grep MiB
```

Then restore it to `0.92` and restart before Lab 3.

---

## What Just Happened

```
Docker pulled vllm/vllm-openai → container started with GPU access
vLLM downloaded Qwen3-0.6B from HuggingFace → loaded onto GPU VRAM
HTTP server started on :8000 with OpenAI-compatible endpoints:
  GET  /health        → liveness probe
  GET  /v1/models     → list loaded models
  POST /v1/chat/completions  → chat inference
  GET  /metrics       → Prometheus scrape target

Prometheus metrics are already being collected by vLLM internally.
Lab 3 will scrape them with a Prometheus server.
```

---

## Common Pitfalls

**`CUDA out of memory` on startup**  
Your GPU doesn't have enough VRAM for Qwen3-0.6B at float16 + KV cache. Lower
`--gpu-memory-utilization` to `0.80` or switch to a smaller model
(`Qwen/Qwen3-0.5B`).

**Download hangs / `401 Unauthorized`**  
The `HF_TOKEN` environment variable is either missing or incorrect. Verify:
```bash
docker exec vllm env | grep HF_TOKEN
```

**`curl: (7) Failed to connect`**  
vLLM is still starting up — the model takes 30–60 seconds to load onto the GPU after
the download completes. Check `docker logs vllm` for the Uvicorn startup line.

**Model not in `/v1/models`**  
The container started but the model failed to load. Check: `docker logs vllm | grep -i error`.

---

## Next

→ **[Lab 3 — Observability Stack](../lab-3-observability/lab.md)**
