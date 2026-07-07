# Self-hosted vLLM serving an OpenAI-compatible API.
# Base image already includes CUDA + vLLM. We only bake in our defaults.
FROM vllm/vllm-openai:latest

# Default config baked into the image; can be overridden at run time
# by mounting /etc/vllm/config.yaml or by passing CLI flags after `--config`.
COPY config.yaml /etc/vllm/config.yaml

EXPOSE 8000

# vllm/vllm-openai's ENTRYPOINT is `python -m vllm.entrypoints.openai.api_server`;
# CMD provides default args. Override at `docker run` to pick a different model.
CMD ["--config", "/etc/vllm/config.yaml"]
