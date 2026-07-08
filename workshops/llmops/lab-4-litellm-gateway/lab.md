# Lab 4 — LiteLLM Gateway

**Duration:** ~75 minutes  
**Goal:** Deploy LiteLLM as an API gateway in front of your vLLM instance. Create
virtual API keys with per-key budget caps and model access restrictions. Route all
client traffic through the gateway, never directly to vLLM. View spend analytics
in the LiteLLM UI.

**Prerequisites:** Lab 2 complete — vLLM running on port 8000.

---

## Why a Gateway?

Without a gateway, every team hits vLLM directly with the same endpoint and the same
key. There's no way to:
- Track which team or application is using how many tokens
- Enforce per-team spending limits
- Restrict which teams can use which models
- Rotate the real model credentials (HF token / OpenAI key) without touching clients
- Add rate limiting, fallbacks, or logging centrally

LiteLLM solves all of this. It is OpenAI API–compatible, so clients need only a URL
and key change — no SDK changes required.

```
Before:  client → vllm:8000/v1/chat/completions  (raw, uncontrolled)
After:   client → litellm:4000/v1/chat/completions (virtual key, budget cap, logged)
```

---

## Part 1 — Configure the Gateway

```bash
cd ~/workshops/workshops/llmops/lab-4-litellm-gateway
```

Review `config.yaml`. It defines:

1. **`general_settings.master_key`** — the admin key. Used to call the LiteLLM
   management API to create virtual keys, view spend, etc. Change this in production.
2. **`litellm_settings.max_budget` / `budget_duration`** — global budget cap across
   all traffic. $10 over 30 days here (tokens from your own vLLM are free, so this
   cap has no real effect — but it demonstrates the mechanism for when you add
   paid models like GPT-4o).
3. **`model_list`** — the models the gateway exposes. Right now it points to your
   vLLM instance by container name (`vllm:8000`).

Edit the master key before deploying (use anything — this is a workshop VM):

```bash
# Edit config.yaml and change master_key to something you'll remember
nano config.yaml
```

---

## Part 2 — Deploy LiteLLM

```bash
docker compose up -d
```

This starts three containers:

| Container | Port | Role |
|-----------|------|------|
| `litellm` | 4000 | Gateway proxy (OpenAI-compatible API + admin UI) |
| `litellm_db` | 5432 | Postgres — stores virtual keys, spend logs, audit trail |
| `prometheus` | 9090 | Scrapes LiteLLM's `/metrics` endpoint |

> Note: this lab's `prometheus` is separate from Lab 3's Prometheus. They're both
> collecting different things. In production you'd merge the scrape configs into one
> Prometheus instance.

Wait for the health check to pass (~30 seconds):

```bash
docker compose ps
```

`litellm` should show `Up (healthy)`.

Test:

```bash
curl http://localhost:4000/health
```

---

## Part 3 — Access the Admin UI

Open in your browser:

```
http://<YOUR_GPU_IP>:4000/ui
```

Login with username `admin` and the `master_key` value from your `config.yaml`.

You should see:
- **Models** tab — your `qwen3-0.6b` model is listed
- **Keys** tab — empty so far
- **Usage** tab — empty so far

---

## Part 4 — Create Virtual Keys

Virtual keys are issued to teams or applications. They carry their own budget, rate
limit, and model access list. The real credentials (your HF token, or an OpenAI API
key) never leave the server.

### Create a key via the UI

1. Go to **Keys → Create Key**
2. Fill in:
   - **Key alias:** `team-backend`
   - **Max budget:** `5`
   - **Budget duration:** `30d`
   - **Models:** select `qwen3-0.6b`
3. Click **Create** — copy the generated key (starts with `sk-...`)

### Create a key via the API

```bash
MASTER_KEY="your-master-key-here"

curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "team-data-science",
    "max_budget": 2,
    "budget_duration": "30d",
    "models": ["qwen3-0.6b"],
    "metadata": {"team": "data-science", "env": "dev"}
  }' | python3 -m json.tool
```

The response includes:
```json
{
  "key": "sk-...",
  "key_alias": "team-data-science",
  "max_budget": 2.0,
  "budget_duration": "30d",
  "models": ["qwen3-0.6b"]
}
```

Create a third key with **no model access** to test the block:

```bash
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "blocked-key",
    "max_budget": 0.01,
    "models": []
  }' | python3 -m json.tool
```

---

## Part 5 — Route Traffic Through the Gateway

Use the `team-backend` key to send a request through LiteLLM to vLLM:

```bash
TEAM_KEY="sk-...your-team-backend-key..."

curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $TEAM_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-0.6b",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "max_tokens": 32
  }' | python3 -m json.tool
```

Now try the blocked key:

```bash
BLOCKED_KEY="sk-...your-blocked-key..."

curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $BLOCKED_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-0.6b",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 16
  }'
```

Expected error: `{"error": {"message": "model not found", ...}}` — the key has no
models allowed, so it cannot route to anything.

Try an invalid key:

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-fake-key" \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3-0.6b", "messages": [{"role": "user", "content": "Hello"}]}'
```

Expected: `401 Unauthorized`.

---

## Part 6 — View Spend Analytics

After sending several requests with each key, go back to the UI:

1. **Usage tab** → you should see token counts per key alias
2. **Keys tab** → each key shows current spend vs budget

Query spend via API:

```bash
# Spend for all keys
curl http://localhost:4000/spend/keys \
  -H "Authorization: Bearer $MASTER_KEY" | python3 -m json.tool

# Spend per model
curl http://localhost:4000/spend/models \
  -H "Authorization: Bearer $MASTER_KEY" | python3 -m json.tool
```

---

## Part 7 — Add a Second Model (Routing)

LiteLLM can route to multiple backends. Add a fallback Ollama model alongside vLLM:

Start an Ollama container on the same network:

```bash
docker run -d \
  --name ollama-server \
  --network llmops-net \
  --gpus all \
  -p 11434:11434 \
  -v ollama:/root/.ollama \
  ollama/ollama

# Pull a small model
docker exec ollama-server ollama pull llama3.2:1b
```

Add it to `config.yaml`:

```yaml
  - model_name: llama3.2-1b
    litellm_params:
      model: ollama/llama3.2:1b
      api_base: http://ollama-server:11434
      timeout: 120
```

Reload LiteLLM config without restarting:

```bash
curl -X POST http://localhost:4000/config/update \
  -H "Authorization: Bearer $MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d @config.yaml
```

Or restart:

```bash
docker compose restart litellm
```

Now send a request to the Ollama model through the same gateway:

```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer $TEAM_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2-1b",
    "messages": [{"role": "user", "content": "Say hello."}],
    "max_tokens": 32
  }' | python3 -m json.tool
```

Both models accessible through one endpoint, one key scheme, one spend log.

---

## Part 8 — View LiteLLM Metrics in Prometheus

LiteLLM exposes Prometheus metrics at `:4000/metrics`. This lab's `prometheus`
container scrapes it.

Open:
```
http://<YOUR_GPU_IP>:9090
```

Query:

```
litellm_requests_metric_total
litellm_total_tokens
litellm_llm_api_latency_metric
```

In production you'd add LiteLLM's metrics as another job in your main Prometheus
instance (the one from Lab 3) so spend, latency, and GPU utilization are all in one
Grafana instance.

---

## What Just Happened

```
LiteLLM (port 4000)
  ├── virtual key "team-backend"   → allowed: [qwen3-0.6b], budget: $5/30d
  ├── virtual key "team-ds"        → allowed: [qwen3-0.6b], budget: $2/30d
  └── virtual key "blocked"        → allowed: [],           budget: $0.01/30d

Client sends request with virtual key
  → LiteLLM validates key (from Postgres)
  → checks model access list
  → routes to the correct backend (vllm:8000 or ollama-server:11434)
  → records tokens used in Postgres against the key's budget
  → returns response to client

Real credentials (HF_TOKEN, etc.) never leave the server.
Clients can be rotated, budget-capped, or revoked without touching the model backends.
```

---

## Common Pitfalls

**`litellm` container exits immediately**  
Usually a Postgres connection error on startup. Postgres takes 5–10 seconds. LiteLLM
retries but if the `start_period` in the healthcheck isn't long enough, Docker may
restart it. Check: `docker logs litellm | tail -20`

**`model not found` for valid key**  
The model name in the request must exactly match a `model_name` in `config.yaml`.
Case-sensitive. `Qwen/Qwen3-0.6B` ≠ `qwen3-0.6b`.

**Spend shows $0.00 for vLLM traffic**  
vLLM traffic is treated as cost=$0.00 per token unless you define a custom pricing
in the model config. This is correct behavior — you're paying for the GPU hour, not
per token. The spend tracker is most useful when you mix paid API models (GPT-4o,
Claude) with self-hosted models.

**UI login fails**  
The UI password is the `master_key` from `config.yaml`, not a separate credential.

---

## Workshop Complete

You now have a production-grade LLM serving stack running on a single GPU:

```
vLLM serving Qwen3-0.6B (and optionally Llama 3.2 via Ollama)
  ↑
LiteLLM gateway — virtual keys, budgets, routing, audit log
  ↑
Prometheus + Grafana — TTFT, TBT, GPU util, queue depth, spend
```

**To tear down:**

```bash
# Lab 4
cd ~/workshops/workshops/llmops/lab-4-litellm-gateway && docker compose down -v

# Lab 3
cd ~/workshops/workshops/llmops/lab-3-observability && docker compose down -v

# Lab 2
cd ~/workshops/workshops/llmops/lab-2-vllm && docker compose down

# Terminate your GPU instance from the cloud console
```

**Do not just close the SSH session — the instance keeps billing.**
