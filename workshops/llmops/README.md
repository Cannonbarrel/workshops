# LLMOps — Serve, Observe, and Route Production LLM Workloads

A hands-on workshop for platform and ML engineering teams. You will deploy a
production-grade LLM serving stack on a neo-cloud GPU instance and operate it end
to end: inference server → observability → load testing → API gateway with virtual
keys, budget caps, and model routing.

**Audience:** Platform engineers, ML engineers, DevOps/SRE teams deploying LLM services.
**Prerequisites:** Linux CLI comfort, Docker basics, SSH key pair, HuggingFace account.
**Duration:** ~5.5 hours across 4 labs (cloud provisioning excluded).

---

## Business Context

Enterprise teams shipping LLM features face three operational problems:

1. **No visibility** — they can't tell if the model is slow because of GPU saturation,
   queue depth, or a bad prompt. Standard APM tools don't expose TTFT or TBT.
2. **No access control** — every team hits the same endpoint with the same key.
   One team's batch job can spike p99 latency for everyone else.
3. **No cost attribution** — finance can't tell which team or product line is
   generating the token spend.

This workshop solves all three with open-source tools: vLLM + Prometheus/Grafana +
LiteLLM.

---

## Architecture

```
                         ┌─────────────────────────────────────────────┐
                         │              neo-cloud GPU VM                │
                         │                                             │
  Client request         │  ┌──────────────┐    ┌──────────────────┐  │
  ─────────────► :4000   │  │   LiteLLM    │    │      vLLM        │  │
  (virtual key           │  │   Gateway    │───►│  OpenAI-compat   │  │
   + budget cap)         │  │  (Postgres)  │    │  inference API   │  │
                         │  └──────┬───────┘    └──────┬───────────┘  │
                         │         │                   │               │
                         │         ▼                   ▼               │
                         │  ┌──────────────────────────────────────┐   │
                         │  │  Prometheus  ◄──── metrics scrapers  │   │
                         │  │  (:9090)     DCGM · Node · cAdvisor  │   │
                         │  └──────────────┬───────────────────────┘   │
                         │                 │                            │
                         │                 ▼                            │
                         │  ┌──────────────────────┐                   │
                         │  │   Grafana  (:3000)   │                   │
                         │  │  vLLM + GPU dashboards│                  │
                         │  └──────────────────────┘                   │
                         └─────────────────────────────────────────────┘
```

---

## What You Build Across the 4 Labs

| Lab | What you do | Key concepts |
|-----|-------------|--------------|
| **Lab 1** — GPU Setup | Provision a GPU VM on Lambda Labs; run Ansible to install Docker + NVIDIA container toolkit | Neo-cloud, Ansible, NVIDIA runtime |
| **Lab 2** — vLLM | Deploy Qwen3-0.6B with vLLM; test the OpenAI-compatible API; inspect the built-in metrics | vLLM, OpenAI API, gpu-memory-utilization, prefix caching |
| **Lab 3** — Observability | Deploy Prometheus + Grafana + DCGM exporter; generate load; read TTFT and throughput dashboards | DCGM, GPU metrics, p95/p99 latency, load testing |
| **Lab 4** — LiteLLM Gateway | Deploy LiteLLM proxy with Postgres; create virtual API keys with per-key budget caps; route traffic | LLM gateway, virtual keys, spend tracking, model routing |

---

## Prerequisites

**Cloud account (one of):**
- [Lambda Labs](https://lambdalabs.com) — A10 at ~$0.60/hr, cheapest for a short workshop
- [RunPod](https://runpod.io) — A40 / A100 spot instances
- [Shadeform](https://shadeform.ai) — multi-cloud spot marketplace

**Local setup:**
```bash
# Python + Ansible
pip install ansible
ansible-galaxy collection install community.general

# SSH key — generate one if you don't have one
ssh-keygen -t ed25519 -f ~/.ssh/llmops-workshop

# HuggingFace account + token (free)
# Go to https://huggingface.co/settings/tokens → New token → Read role
export HF_TOKEN="hf_..."
```

**GPU sizing:**
| Model | Min VRAM | Instance |
|-------|----------|----------|
| Qwen3-0.6B (this workshop) | 4 GB | 1× A10 / T4 / RTX 3090 |
| Llama 3.1 8B | 18 GB | 1× A100-40G |
| Llama 3.1 70B | 140 GB | 4× A100-80G |

This workshop uses Qwen3-0.6B so any single-GPU instance works.

---

## Lab Order

```
Lab 1 → Lab 2 → Lab 3 → Lab 4
```

Labs 2, 3, and 4 each depend on the previous. Complete them in order on the same VM.

---

## Key Terms

| Term | Meaning |
|------|---------|
| **TTFT** | Time To First Token — latency from request sent to first token received. The user-perceived "responsiveness" metric. |
| **TBT** | Time Between Tokens — inter-token latency during streaming. Determines how smooth the stream feels. |
| **Prefill** | The GPU pass that processes your input prompt and fills the KV cache. Expensive for long prompts. |
| **Decode** | Token generation, one token at a time. Latency per token is TBT. |
| **KV Cache** | Key-value attention cache. vLLM manages this to batch multiple requests. The `gpu-memory-utilization` parameter controls how much VRAM vLLM reserves for it. |
| **Virtual key** | A per-team or per-app API key in LiteLLM. Carries its own budget, rate limit, and model access list. The upstream model key (your HF token / real API key) is never exposed. |
| **DCGM** | Data Center GPU Manager. NVIDIA's tool for exporting fine-grained GPU telemetry (per-GPU temperature, SM utilization, memory bandwidth, NVLink stats). |

---

## Neo-Cloud vs Hyperscaler

This workshop runs on a **neo-cloud** GPU provider (Lambda Labs, RunPod, Shadeform)
rather than AWS/Azure/GCP. For training workshops:

| | Neo-cloud | Hyperscaler |
|--|-----------|-------------|
| A100-80G on-demand (hourly) | ~$2.00 | ~$4.10 (AWS p4) |
| Startup time | 2–5 min | 5–15 min |
| Setup complexity | SSH + Docker | VPC + subnets + security groups |
| IAM / network overhead | Minimal | High |

For a 6-student cohort doing a 5-hour workshop: **~$36 total** on Lambda Labs
A10 vs **~$123** on AWS p3.2xlarge. The infra difference is real; the learning
difference is not (Docker, vLLM, and Prometheus behave identically).

---

## Cost Reminder

GPU instances bill by the hour from the moment they start. After the workshop:

```bash
# Stop the containers before you terminate the instance
docker compose down

# Then terminate the instance from the cloud console — do not just SSH out.
```

Lambda Labs charges ~$0.60/hr for an A10. A 5-hour workshop = ~$3. Forgetting to
terminate and leaving it overnight = ~$14.
