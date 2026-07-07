# Lab — Deploy to EC2 with Shell Script and GitHub Actions

## What You Will Do

1. Launch an EC2 instance using Terraform
2. Deploy a nginx Hello World page using a shell script
3. Automate the same deployment using GitHub Actions

---

## Part 1 — Launch EC2 with Terraform

### Step 1: Navigate to the Terraform folder

```bash
cd Chapter-6/terraform-ec2
```

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Preview what will be created

```bash
terraform plan
```

You will see it plans to create an EC2 instance, a key pair, and a security group.

### Step 4: Apply

```bash
terraform apply
```

Type `yes` when prompted. Wait about 30 seconds.

### Step 5: Note the outputs

```
instance_public_ip = "54.123.45.67"
ssh_command        = "ssh -i ssh-keys/student-employee-app-key.pem ubuntu@54.123.45.67"
```

Save the public IP — you will need it throughout this lab.

---

## Part 2 — Deploy nginx with a Shell Script

### Step 1: SSH into the EC2 instance

Use the `ssh_command` from the Terraform output:

```bash
ssh -i ssh-keys/student-employee-app-key.pem ubuntu@YOUR_EC2_IP
```

### Step 2: Copy and run the setup script

Once inside the EC2 instance, copy and paste this entire script into the terminal and press Enter:

```bash
#!/bin/bash
set -e

echo "=== Installing nginx ==="
sudo apt-get update -y -q
sudo apt-get install -y -q nginx

echo "=== Creating Hello World page ==="
sudo tee /var/www/html/index.html > /dev/null <<'EOF'
<!DOCTYPE html>
<html>
  <head><title>Hello World</title></head>
  <body>
    <h1>Hello World from EC2!</h1>
    <p>Deployed via shell script.</p>
  </body>
</html>
EOF

sudo systemctl enable nginx
sudo systemctl start nginx

echo "Done! Open http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
```

### Step 3: Open the browser

Open `http://YOUR_EC2_IP` — you should see:

> **Hello World from EC2!**
> Deployed via shell script.

---

## Part 3 — Deploy the Same Page using GitHub Actions

Now automate the same deployment so every push to GitHub updates the page.

### Step 1: Create a new GitHub repository

- Go to GitHub and create a new repo called `hello-cicd`
- Initialize it with a README

### Step 2: Clone it locally and add `index.html`

```bash
git clone https://github.com/YOUR_USERNAME/hello-cicd.git
cd hello-cicd
```

Create `index.html`:

```html
<!DOCTYPE html>
<html>
  <head><title>Hello World</title></head>
  <body>
    <h1>Hello World from EC2!</h1>
    <p>Deployed via GitHub Actions.</p>
  </body>
</html>
```

### Step 3: Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these three secrets:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | Your EC2 public IP (e.g. `54.123.45.67`) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Full contents of `ssh-keys/student-employee-app-key.pem` |

To get the key contents:
```bash
cat Chapter-6/terraform-ec2/ssh-keys/student-employee-app-key.pem
```
Copy everything including the `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` lines.

### Step 4: Create the workflow file

Inside your `hello-cicd` repo, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy nginx to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            sudo apt-get install -y -q nginx

            sudo tee /var/www/html/index.html > /dev/null <<'EOF'
            <!DOCTYPE html>
            <html>
              <head><title>Hello World</title></head>
              <body>
                <h1>Hello World from EC2!</h1>
                <p>Deployed via GitHub Actions.</p>
              </body>
            </html>
            EOF

            sudo systemctl enable nginx
            sudo systemctl start nginx
```

### Step 5: Push everything

```bash
git add .
git commit -m "Add CI/CD workflow"
git push origin main
```

### Step 6: Watch it deploy

Go to your repo → **Actions** tab → click the running workflow → watch each step live.

### Step 7: Verify

Open `http://YOUR_EC2_IP` — page now says **Deployed via GitHub Actions.**

---

## Step 8: Make a Change and Push

Edit `index.html` — change the message to anything:

```html
<p>Version 2 — updated automatically! 🚀</p>
```

Push:

```bash
git add .
git commit -m "Version 2"
git push origin main
```

Refresh the browser — your change is live within seconds.

---

## Cleanup

When done, destroy all AWS resources to avoid charges:

```bash
cd Chapter-6/terraform-ec2
terraform destroy
```

Type `yes` when prompted.
