# Lab 1 — GPU Server Setup

**Duration:** ~45 minutes  
**Goal:** Provision a GPU VM on a neo-cloud provider, run an Ansible playbook to
install Docker CE and the NVIDIA Container Toolkit, and validate that GPU-accelerated
containers work before moving on.

---

## Part 1 — Provision a GPU Instance

### Lambda Labs (recommended for this workshop)

1. Log in at [cloud.lambdalabs.com](https://cloud.lambdalabs.com)
2. Go to **Instances → Launch Instance**
3. Select:
   - **GPU type:** 1× A10 (24 GB) — sufficient for Qwen3-0.6B
   - **Region:** any with availability
   - **SSH key:** add your public key (`~/.ssh/llmops-workshop.pub`)
4. Click **Launch** and wait ~2 minutes for `Running` status
5. Copy the public IP from the instance list

> **RunPod alternative:** Select a community cloud pod with RTX 3090 or A10, choose
> the Ubuntu 22.04 base image (not a pre-built PyTorch image — those add noise).

### Verify SSH access

```bash
ssh ubuntu@<YOUR_GPU_IP>
```

You should see an Ubuntu 22.04 or 24.04 shell. The NVIDIA driver is **not** installed
yet on base Lambda Labs images — that's what the Ansible playbook handles.

If your cloud provider pre-installs CUDA drivers, skip Part 2 and go straight to
Part 3 (NVIDIA Container Toolkit only). You can check:

```bash
nvidia-smi    # if this returns GPU info, drivers are already installed
```

---

## Part 2 — Configure Ansible Inventory

On your **local machine**, edit the inventory file:

```bash
cd workshops/llmops/lab-1-gpu-setup
```

Edit `ansible/inventory/hosts.ini`:

```ini
[llm_workers]
<YOUR_GPU_IP> ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/llmops-workshop
```

Install the required Ansible collections:

```bash
ansible-galaxy collection install -r ansible/collections/requirements.yml
```

Test connectivity:

```bash
ansible llm_workers -i ansible/inventory/hosts.ini -m ping
```

Expected output:
```
<YOUR_GPU_IP> | SUCCESS => {
    "ping": "pong"
}
```

---

## Part 3 — Run the Setup Playbook

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/setup_worker.yml
```

The playbook runs two roles:
1. **docker_install** — installs Docker CE, enables the service, adds `ubuntu` to the
   `docker` group
2. **nvidia-toolkit** — installs CUDA drivers and the NVIDIA Container Toolkit, then
   configures Docker to use the `nvidia` runtime

Runtime: ~5–8 minutes (driver download is the slow step).

---

## Part 4 — Validate the Setup

SSH into the instance:

```bash
ssh ubuntu@<YOUR_GPU_IP>
```

### Check GPU is visible

```bash
nvidia-smi
```

Expected (example on A10):
```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 535.x   Driver Version: 535.x   CUDA Version: 12.2              |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  NVIDIA A10          Off  | 00000000:00:1E.0 Off |                  Off |
|  0%   30C    P8    17W / 150W |      0MiB / 23028MiB |      0%      Default |
+-----------------------------------------------------------------------------+
```

### Check Docker can access the GPU

```bash
docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
```

You should see the same `nvidia-smi` output from inside a container. If you see
`docker: Error response from daemon: unknown runtime "nvidia"` — restart Docker:

```bash
sudo systemctl restart docker
```

Then log out and back in (to pick up the `docker` group membership):

```bash
exit
ssh ubuntu@<YOUR_GPU_IP>
```

### Create the shared Docker network

All services in this workshop communicate over a named bridge network:

```bash
docker network create llmops-net
```

---

## What Just Happened

```
Ansible ran 2 roles on your GPU VM:
  docker_install → Docker CE + containerd + compose plugin
  nvidia-toolkit → CUDA keyring → cuda-drivers → nvidia-container-toolkit
                   → nvidia-ctk runtime configure --runtime=docker
                   → Docker daemon restarted with nvidia runtime registered

Your VM is now:
  ✅ Running Docker CE
  ✅ GPU visible inside containers (--gpus all flag works)
  ✅ Shared network "llmops-net" created
```

---

## Common Pitfalls

**Ansible hangs on `Install cuda-drivers`**  
CUDA driver install is slow (3–5 min) and produces no output. Wait it out; do not Ctrl+C.

**`nvidia-smi` works but Docker GPU access fails**  
The `nvidia-ctk runtime configure` step writes `/etc/docker/daemon.json`. If Docker
was already running when this happened, it needs a restart:
```bash
sudo systemctl restart docker
```

**Wrong `ansible_user`**  
Lambda Labs uses `ubuntu`. Some providers (RunPod) use `root`. Check your provider's docs.

**SSH permission denied**  
Ensure your key file permissions are `0600`:
```bash
chmod 600 ~/.ssh/llmops-workshop
```

---

## Next

→ **[Lab 2 — Deploy vLLM](../lab-2-vllm/lab.md)**
