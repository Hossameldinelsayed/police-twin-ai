# 🚀 Deploy POLICE TWIN AI to Google Cloud (shareable link)

This deploys the app to **Google Cloud Run** and gives you a public HTTPS link like
`https://police-twin-ai-xxxxxxxx.run.app` that you can share with anyone.

> **You run these steps in YOUR Google Cloud — I can't sign into your account or click your console links.**
> Everything below is copy‑paste into **Cloud Shell**, which is already signed in as you.

**Project:** `project-1fcdf004-4c10-455f-99a`
**Upload bundle:** `Desktop\police-twin-ai-upload.zip` (already created for you)

---

## Before you start (one-time)
Cloud Run needs **billing enabled** on the project. There's a generous always‑free tier (2M requests/month), so a demo is effectively free — but billing must be switched on.
- Open: https://console.cloud.google.com/billing → link a billing account to project `project-1fcdf004-4c10-455f-99a`.
- (Optional, recommended) Set a **budget alert** of e.g. $5 so you're notified of any spend.

---

## Step 1 — Open Cloud Shell
Go to: **https://shell.cloud.google.com/?show=terminal**
Wait for the black terminal at the bottom to be ready.

## Step 2 — Upload the app bundle
1. In Cloud Shell, click the **⋮ (three dots)** menu at the top‑right of the terminal → **Upload**.
2. Choose **`police-twin-ai-upload.zip`** from your **Desktop**.
3. Wait for "Upload complete".

## Step 3 — Unzip it
Paste this and press Enter:
```bash
rm -rf police-twin-ai && mkdir police-twin-ai && unzip -q ~/police-twin-ai-upload.zip -d police-twin-ai && cd police-twin-ai && ls
```
You should see `Dockerfile`, `package.json`, `app`, `components`, `lib`, etc.

## Step 4 — Point at your project
```bash
gcloud config set project project-1fcdf004-4c10-455f-99a
```

## Step 5 — Deploy 🚀
```bash
gcloud run deploy police-twin-ai \
  --source . \
  --region me-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi
```
- If it asks **"API … not enabled, enable?"** → type **`y`** and Enter (it enables Cloud Run, Cloud Build, Artifact Registry).
- If it asks to **create a repository** → type **`y`**.
- The first deploy builds the container; it takes **~3–6 minutes**. Grab a coffee. ☕

## Step 6 — Get your shareable link
When it finishes you'll see:
```
Service [police-twin-ai] revision [...] has been deployed and is serving 100 percent of traffic.
Service URL: https://police-twin-ai-xxxxxxxx.me-central1.run.app
```
👉 **That `Service URL` is your shareable link.** Open it, send it to anyone — it works on any device, no install.

---

## Updating later
After changing the app, re‑create the zip (re‑run the packaging step) and repeat Steps 2–5. Same URL stays.

## Cost & turning it off
- Light demo traffic stays within the **free tier**. The container image in Artifact Registry costs a few cents/month at most.
- To **stop everything / avoid any charge**, delete the service and image:
  ```bash
  gcloud run services delete police-twin-ai --region me-central1
  ```

## Troubleshooting
| Problem | Fix |
|---|---|
| `Billing must be enabled` | Link a billing account (see "Before you start"). |
| Region error / not available | Replace `me-central1` with `europe-west1` (or run `gcloud run regions list`). |
| Build fails on memory | Add `--memory 2Gi` to the deploy command. |
| Permission denied | Make sure you're the **Owner/Editor** of the project. |

---

### Alternative (even simpler): Firebase Hosting
If Cloud Run feels heavy, the app can also run as a static site on **Firebase Hosting** (free, `https://<project>.web.app`). Ask me and I'll switch the build to static export and give you those 3 commands instead.
