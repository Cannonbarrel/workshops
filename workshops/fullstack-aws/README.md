# Full-Stack on AWS — Free Bootcamp Curriculum

> Build and ship a production-ready full-stack app on AWS — React + FastAPI + MongoDB + Terraform + GitHub Actions + AI coding tools.

**⭐ Star and fork this repo** — it's the reference you'll keep coming back to after the bootcamp.

---

## What You'll Build

A deployable, portfolio-ready full-stack app on AWS, built with AI-assisted coding:

| Layer | Tech |
|---|---|
| Frontend | React |
| Backend | FastAPI (Python) |
| Database | MongoDB |
| Auth | JWT |
| Infrastructure | Terraform on AWS |
| CI/CD | GitHub Actions |
| AI Tools | Cursor, Claude, Claude Code, GitHub Copilot |

---

## Curriculum

| Chapter | Topic | What's Covered |
|---|---|---|
| [01 — Vibe Coding](./chapters/01-vibe-coding/) | Fundamentals | Prompting strategies, building a FastAPI app with AI |
| [02 — Backend & Databases](./chapters/02-backend-databases/) | Backend | Employee CRUD API, MongoDB integration |
| [03 — Testing](./chapters/03-testing/) | TDD | TDD cycle, writing tests with AI assistance |
| [04 — Security](./chapters/04-security/) | Auth | API key security, JWT authentication |
| [05 — Infrastructure](./chapters/05-infrastructure/) | IaC | Terraform fundamentals, provisioning AWS resources |
| [06 — Cloud & CI/CD](./chapters/06-cloud-cicd/) | AWS | EC2, Lambda, API Gateway, S3, GitHub Actions |
| [07 — React](./chapters/07-react/) | Frontend | React labs, component architecture, full-stack integration |

---

## Projects

| Project | Stack | Description |
|---|---|---|
| [01 — Task Tracker](./projects/01-task-tracker/) | React + Lambda + MongoDB | Kanban-style task board — full-stack capstone |
| [02 — Notice Board](./projects/02-notice-board/) | React + S3 + Lambda | Assignment with 3 difficulty tiers |
| [03 — URL Bookmark Saver](./projects/03-url-bookmark-saver/) | React + Lambda + DynamoDB | Serverless bookmark app with CI/CD pipeline |
| [04 — Architecture Diagram](./projects/04-architecture-diagram/) | React + S3 + CloudFront | Static SPA deployed via Terraform |

Each project has working Terraform, a deploy script, and a GitHub Actions pipeline. Deploy to your own AWS account in under 30 minutes.

---

## Quick Start

```bash
git clone https://github.com/becloudready/workshops.git
cd workshops/fullstack-aws
```

Prerequisites: AWS account (free tier works), AWS CLI, Terraform, Node.js 18+, Python 3.10+, Git.

Start at [Chapter 01](./chapters/01-vibe-coding/).

---

## Who This Is For

- Fresh graduates preparing for a first engineering role
- Developers stuck at tutorial level who haven't shipped a real deployed app
- Anyone using AI coding tools (Cursor, Claude, Copilot) who needs the engineering fundamentals employers expect
- Job seekers who want a portfolio project that runs in production, not localhost

---

## Resource Naming (required — read before you start)

Every AWS resource you create must start with:

```
student-<your-slug>-
```

Your slug is assigned by the cohort admin (e.g. `alice-johnson`). The IAM policy enforces this — resources outside your namespace will be denied.

Tag every resource:

| Key | Value |
|---|---|
| `student` | your slug |
| `cohort` | your cohort name |

Terraform projects handle this automatically when you pass `student_name=<slug>`.

---

## 50 Practice Questions

[`fullstack-bootcamp-mcq-50.csv`](./fullstack-bootcamp-mcq-50.csv) — 50 MCQs covering the full curriculum. Use for self-assessment or interview prep.

---

## Live Delivery

This curriculum is delivered as an instructor-led workshop by [beCloudReady](https://becloudready.com).

- **Format:** 1-week intensive, live sessions + async lab time
- **Stack:** per-student AWS sandbox with GitHub Copilot seats included
- **Outcome:** deployed portfolio project + CI/CD pipeline in production

[Book a cohort for your team →](https://becloudready.com/workshops)

---

## Sandbox Setup (Instructor / Admin)

The [`terraform-iam/`](./terraform-iam/) folder provisions per-student AWS sandboxes for live cohorts — IAM users, namespace-scoped managed policies, Terraform workspaces per batch.

See [`admin-walkthrough.md`](./admin-walkthrough.md) for the full cohort setup process.

---

## License

MIT — fork it, use it, build on it.
