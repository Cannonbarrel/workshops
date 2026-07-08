# Lab 3 — Observability Stack

**Duration:** ~60 minutes  
**Goal:** Deploy Prometheus, Grafana, and the NVIDIA DCGM GPU exporter alongside
your running vLLM container. Generate realistic load with the included scripts.
Read and interpret the key LLM serving metrics on a live Grafana dashboard.

**Prerequisites:** Lab 2 complete — vLLM running on port 8000.

---

## Part 1 — The Observability Stack

The monitoring stack consists of five containers:

| Container | Port | Role |
|-----------|------|------|
| `prometheus` | 9090 | Scrapes metrics from all exporters on a 5s interval |
| `grafana` | 3000 | Dashboard UI — Prometheus is pre-wired as a data source |
| `dcgm-exporter` | 9400 | NVIDIA GPU metrics: SM utilization, VRAM, temperature, power, memory bandwidth |
| `node-exporter` | 9100 | Host OS metrics: CPU, RAM, network, disk I/O |
| `cadvisor` | 8080 | Per-container resource usage |

All five share `llmops-net` with the vLLM container, so Prometheus can reach vLLM's
`/metrics` endpoint by container name.

---

## Part 2 — Deploy the Stack

```bash
cd ~/workshops/workshops/llmops/lab-3-observability
docker compose up -d
```

Check all five containers are running:

```bash
docker compose ps
```

Expected:
```
NAME             STATUS
cadvisor         Up
dcgm-exporter    Up
grafana          Up
node-exporter    Up
prometheus       Up
```

---

## Part 3 — Verify Prometheus Targets

Open Prometheus in your browser:

```
http://<YOUR_GPU_IP>:9090/targets
```

You should see four targets, all green (`State: UP`):

| Job | Target | What it scrapes |
|-----|--------|----------------|
| `vllm-service` | `vllm:8000` | vLLM inference metrics |
| `dcgm` | `dcgm-exporter:9400` | GPU hardware metrics |
| `node` | `node-exporter:9100` | Host OS metrics |
| `cadvisor` | `cadvisor:8080` | Container resource usage |

**If a target shows `DOWN`:** check that the container is running and on `llmops-net`.
Most common cause is that dcgm-exporter needs a few seconds after startup to register
the GPU.

Run a quick spot check — query the number of vLLM requests running:

```
http://<YOUR_GPU_IP>:9090/graph?g0.expr=vllm%3Anum_requests_running
```

---

## Part 4 — Open Grafana

```
http://<YOUR_GPU_IP>:3000
```

Login: **admin / admin** (you'll be prompted to change the password — skip it for the workshop).

Two dashboards are pre-provisioned:

### vLLM Dashboard

Go to **Dashboards → vLLM Performance**

Panels:
- **Running / Waiting / Swapped Requests** — current batch sizes
- **KV Cache Usage %** — how full the GPU memory cache is
- **E2E Request Latency** — p50 / p95 / p99 histogram
- **Time To First Token (TTFT)** — p50 / p95 / p99
- **Time Per Output Token (TBT)** — decode speed
- **Token Throughput** — tokens/sec for prompts and generation

Most panels are empty right now because no load has been sent. That changes in Part 5.

### NVIDIA GPU Dashboard

Go to **Dashboards → NVIDIA GPU Metrics**

Panels:
- **GPU Utilization %** — SM (CUDA core) utilization per GPU
- **GPU Memory Used / Free**
- **GPU Temperature**
- **GPU Power Draw** (watts)
- **Memory Bandwidth** (GB/s)

---

## Part 5 — Generate Load

Open a second SSH session to the GPU VM. Run the continuous load generator:

```bash
cd ~/workshops/workshops/llmops/scripts
pip install -r requirements.txt   # only aiohttp needed

# Continuous load: 4 workers, each sending requests as fast as possible
VLLM_BASE_URL=http://localhost:8000 \
WORKERS=4 \
SLEEP=0.1 \
python3 load_vllm.py
```

Let it run for 2–3 minutes. Switch back to Grafana and watch:

1. **Running Requests** climbs to 3–8 (batch filling up)
2. **KV Cache Usage %** increases
3. **TTFT p95** will be higher than p50 (tail latency)
4. **GPU Utilization** should be 40–80%+ on the NVIDIA dashboard
5. **GPU Power Draw** increases with utilization

---

## Part 6 — Ramp Load Test

Stop the continuous load (Ctrl+C) and run the ramp test instead:

```bash
VLLM_URL=http://localhost:8000/v1/chat/completions \
python3 rampup_vllm.py
```

This sweeps concurrency from 1 → 2 → 4 → 8 → 12 → 16 → 24 → 32 and reports
latency buckets at each level. Watch the terminal output alongside the Grafana
TTFT panel.

Key observation: at some concurrency level, the p99 TTFT starts growing much faster
than p50. This is where the KV cache fills and requests begin queuing — that's your
**saturation point** for this model/GPU combination.

For Qwen3-0.6B on an A10, saturation typically appears around concurrency=16–24.

---

## Part 7 — Interpret What You're Seeing

### TTFT vs TBT

| Metric | What drives it | How to reduce it |
|--------|---------------|-----------------|
| TTFT | Prefill cost (prompt length × model size) | Shorter system prompts, prefix caching, larger batch |
| TBT | Decode throughput (model flops / GPU bandwidth) | Bigger GPU, speculative decoding, smaller model |

### Queue depth tells you about saturation

- `vllm:num_requests_waiting > 0` consistently → KV cache is full → new requests
  are queuing → p99 TTFT will spike
- If waiting queue is always 0 but GPU is at 40%, you have headroom to serve more
  traffic without degrading latency

### The prefix caching effect

Send the same system prompt with different user questions:

```bash
for i in 1 2 3 4 5; do
  time curl -s http://localhost:8000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"Qwen/Qwen3-0.6B\",
      \"messages\": [
        {\"role\": \"system\", \"content\": \"You are a helpful assistant. Answer only in JSON format.\"},
        {\"role\": \"user\", \"content\": \"Question number $i: what is 2 + $i?\"}
      ],
      \"max_tokens\": 32
    }" > /dev/null
done
```

With `--enable-prefix-caching`, requests 2–5 will have lower TTFT than request 1
because the system prompt KV vectors are reused from the cache. You can see this in
the TTFT histogram narrowing after the first request.

---

## What Just Happened

```
Prometheus (5s scrape interval)
  ├── scrapes vllm:8000/metrics → all vLLM counters + histograms
  ├── scrapes dcgm-exporter:9400 → DCGM_FI_DEV_GPU_UTIL, DCGM_FI_DEV_FB_USED, etc.
  ├── scrapes node-exporter:9100 → node_cpu_seconds_total, node_memory_*, etc.
  └── scrapes cadvisor:8080 → container_cpu_usage_seconds_total, etc.

Grafana
  ├── reads from Prometheus via pre-provisioned data source
  └── pre-provisioned dashboards render panels from PromQL queries

Load test
  └── sent N concurrent chat requests → filled vLLM batch → increased GPU util
      → metrics moved in Grafana → you read what saturation looks like
```

---

## Common Pitfalls

**Grafana panels show "No data"**  
First check: `http://<IP>:9090/targets` — are all targets UP?  
Second check: verify the time range in Grafana is "Last 5 minutes" not "Last 1 hour"
(no data at the far left of a fresh deployment).

**`dcgm-exporter` container exits immediately**  
The DCGM exporter requires the NVIDIA Container Toolkit runtime. Verify:
```bash
docker inspect dcgm-exporter | grep -i runtime
```

**TTFT stays at 0 / panels empty after load test**  
The `vllm` container must be on `llmops-net` for Prometheus to reach it by hostname.
Verify: `docker inspect vllm | grep -A5 Networks`

**`permission denied` on `/var/lib/dcgm`**  
Create it manually: `sudo mkdir -p /var/lib/dcgm && sudo chmod 777 /var/lib/dcgm`

---

## Next

→ **[Lab 4 — LiteLLM Gateway](../lab-4-litellm-gateway/lab.md)**
