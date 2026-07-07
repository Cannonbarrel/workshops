# vLLM endpoint

Self-hosted, OpenAI-compatible LLM server. The agent (separate repo) points at this URL instead of Databricks Model Serving.

## What's here

- [Dockerfile](Dockerfile) — thin layer over `vllm/vllm-openai:latest` that bakes in [config.yaml](config.yaml)
- [config.yaml](config.yaml) — model, port, dtype, context length, GPU memory utilization
- [run.sh](run.sh) — `docker build` + `docker run` with GPU passthrough and a HuggingFace cache mount

## Deploying on a Shadeform GPU instance

1. **Launch a GPU instance.** Shadeform → choose an A100 80GB (Llama-3-8B fits comfortably) or H100. Pick an Ubuntu image with NVIDIA drivers preinstalled. SSH in.

2. **Verify NVIDIA + Docker GPU runtime.**
   ```bash
   nvidia-smi                                                    # driver OK?
   docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi   # container GPU OK?
   ```
   If the second command fails, install [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

3. **Clone this repo** and `cd` into `vllm/`.

4. **Set HF_TOKEN** if the model is gated (Llama-3 is):
   ```bash
   export HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

5. **Start the server.**
   ```bash
   ./run.sh
   # or pick a different model:
   MODEL=mistralai/Mistral-7B-Instruct-v0.3 ./run.sh
   ```

   First run downloads the model weights into `~/.cache/huggingface/` (Llama-3-8B is ~16 GB).

6. **Open the port.** In Shadeform, expose port 8000 to your IP, or run an SSH tunnel:
   ```bash
   ssh -L 8000:localhost:8000 user@gpu-host
   ```

## Smoke test

```bash
curl -s http://localhost:8000/v1/models | jq

curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3-8b",
    "messages": [
      {"role": "system", "content": "You translate plain English questions into a single SQL query."},
      {"role": "user",   "content": "How much revenue did each product category make last quarter?"}
    ],
    "temperature": 0,
    "max_tokens": 256
  }' | jq
```

The `model` field must match `served-model-name` in [config.yaml](config.yaml).

## Logging / observability

vLLM emits per-request logs to stdout including prompt tokens, generation tokens, and latency. To capture:

```bash
./run.sh 2>&1 | tee vllm.log
```

For Prometheus metrics, vLLM exposes `/metrics` on the same port — scrape it from a Prometheus on the same host or wire it into your existing observability stack.
