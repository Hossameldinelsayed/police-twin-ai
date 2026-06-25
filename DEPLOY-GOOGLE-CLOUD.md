# 🚀 Deploy POLICE TWIN AI to Google Cloud (shareable link)

Deploys the app to **Google Cloud Run** → a public HTTPS link like
`https://police-twin-ai-xxxxxxxx.me-central1.run.app` you can share with anyone.

> **You run these in YOUR Cloud Shell** (already signed in as you). I can't access your Google Cloud account.

**Project:** `project-1fcdf004-4c10-455f-99a`
**Code (public repo):** https://github.com/Hossameldinelsayed/police-twin-ai

---

## Before you start (one-time)
Cloud Run needs **billing enabled** on the project (big always‑free tier — a demo is basically free).
- https://console.cloud.google.com/billing → link a billing account to `project-1fcdf004-4c10-455f-99a`.
- Optional: set a **$5 budget alert**.

---

## Step 1 — Open Cloud Shell
👉 https://shell.cloud.google.com/?show=terminal — wait for the terminal.

## Step 2 — Get the code + deploy (copy ALL of this, paste, Enter)
```bash
cd ~ && rm -rf police-twin-ai && \
git clone https://github.com/Hossameldinelsayed/police-twin-ai.git && \
cd police-twin-ai/frontend && \
gcloud config set project project-1fcdf004-4c10-455f-99a && \
gcloud run deploy police-twin-ai \
  --source . \
  --region me-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi
```

While it runs:
- If asked **"… API … enable?"** → type **`y`** Enter (enables Cloud Run, Cloud Build, Artifact Registry).
- If asked to **create a repository** → **`y`**.
- First build takes **~4–6 min** (it uses the included `Dockerfile`). ☕

## Step 3 — Your shareable link
At the end it prints:
```
Service URL: https://police-twin-ai-xxxxxxxx.me-central1.run.app
```
👉 **That's your link.** Works on any device, no install. Share away.

---

## Why the first attempt failed
The zip never uploaded, so the deploy ran from an empty home folder with no `Dockerfile` → it fell back to "Buildpacks" and failed. Cloning the repo + deploying from `police-twin-ai/frontend` (which has the `Dockerfile`) fixes both issues.

## Update later
```bash
cd ~/police-twin-ai && git pull && cd frontend && \
gcloud run deploy police-twin-ai --source . --region me-central1 --allow-unauthenticated --port 8080 --memory 1Gi
```
(Same URL stays. I push code changes to GitHub; you re-run this.)

## Turn it off (guarantee $0)
```bash
gcloud run services delete police-twin-ai --region me-central1
```

## Troubleshooting
| Problem | Fix |
|---|---|
| `Billing must be enabled` | Link a billing account (see top). |
| Region not available | Replace `me-central1` with `europe-west1`. |
| Build OOM / fails | Add `--memory 2Gi`; or paste me the Cloud Build log link and I'll fix it. |
| `Permission denied` | Be sure you're **Owner/Editor** of the project. |
