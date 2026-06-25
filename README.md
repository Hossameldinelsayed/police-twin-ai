<div align="center">

# 🛰️ POLICE TWIN AI

### An AI command center & live digital twin for smart police facilities.

*See the whole building think. Predict failures before they happen. Brief the room in one glance.*

![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2.12-22B5BF?style=for-the-badge)

![License](https://img.shields.io/badge/License-Demo_/_Evaluation-1e293b?style=flat-square)
![Status](https://img.shields.io/badge/Status-Executive_Demo_Ready-10b981?style=flat-square)
![Database](https://img.shields.io/badge/Runs_with-Zero_Database-8b5cf6?style=flat-square)

</div>

---

> **POLICE TWIN AI** fuses an interactive 3D **digital twin** of a police headquarters with an **explainable AI layer** — composite risk scoring, predictive maintenance, an emergency-response simulator and a conversational copilot — into a single, executive-grade **command center**.
>
> The reference facility is **Central Command HQ** (`PTX-HQ-01`): a 6-level, ~42,800 m² smart police headquarters with ~48 building assets, live telemetry and a running incident stream. Everything you see is computed by a **deterministic mock intelligence engine**, so the entire platform runs offline with **no database, no API keys, and no cloud** — just `npm install && npm run dev`.

---

## ✨ Why it matters

Modern police and critical-security facilities run on a tangle of disconnected systems — building management (BMS), video (VMS), access control (ACS), power, fire and IoT. POLICE TWIN AI shows what happens when you put a **single intelligent pane of glass** over all of them:

- **One situational truth** — security, energy, occupancy and infrastructure in one composite view.
- **Explainable AI, not a black box** — every risk number traces back to weighted domains and named signals.
- **Predict, don't react** — failures are surfaced *days* before they hit, with cost-avoided quantified.
- **Rehearse the crisis** — fire, power-loss, intrusion and equipment-failure playbooks, simulated and timed.
- **Ask in plain language** — a grounded copilot that answers from live facility state with citations.

---

## 🧩 Key capabilities by module

The platform is organized as **7 modules**, each a route in the app:

| # | Module | Route | What it delivers |
|---|--------|-------|------------------|
| 01 | **Executive Command Center** | `/` | Six headline KPIs (risk, alarms, energy, occupancy, security, maintenance), an **AI Situation Brief**, the four-domain risk breakdown, 24h energy-vs-baseline chart, live alarm feed, predictive-maintenance highlights, occupancy-by-floor, and a module launchpad. |
| 02 | **Interactive Digital Twin** | `/digital-twin` | A real **3D model** of all 6 floors and ~48 assets (Three.js / React Three Fiber). Floor selector, per-category asset-layer toggles, click any marker for live telemetry, orbit / pan / zoom. |
| 03 | **AI Copilot** | `/copilot` | A conversational assistant grounded on live state — risk, alarms, maintenance, last-24h, energy, occupancy and recommendations — answering with bullet evidence, **citations** and suggested follow-ups. |
| 04 | **AI Risk Engine** | `/risk-engine` | An **explainable weighted risk model** (equipment 40% · security 30% · energy 16% · occupancy 14%) with per-domain signals, prioritized recommendations, a **what-if simulator**, and a 30-day trend. |
| 05 | **Predictive Maintenance** | `/predictive-maintenance` | Failure prediction with asset health %, days-to-failure, driver signals, a filterable asset table, work orders, and **downtime cost avoided**. |
| 06 | **Emergency Center** | `/emergency` | Four simulatable scenarios — **fire, power outage, unauthorized access, equipment failure** — each with impacted zones, an animated automated+human response playbook, recovery time, and cascade risks. |
| 07 | **Executive Dashboard** | `/dashboard` | 30-day trend charts (risk · alarms · energy · asset health), distributions (energy mix, alarms by type, assets by category) and the 24h occupancy curve. |

---

## 🖥️ The screens

A quick tour of what each screen delivers. (Full narrated descriptions — the visual spec — live in [`docs/SCREENSHOTS.md`](docs/SCREENSHOTS.md).)

- **Command Center** — a dark, glassmorphic executive cockpit. A violet AI Situation Brief headlines the page, calling out that facility risk is **High (≈64/100)**, driven by power and access faults, at **88% model confidence**. Six glowing KPI cards animate in; an animated 270° risk gauge sits beside the four-domain breakdown.
- **Digital Twin** — six translucent floor slabs stacked in 3D, dotted with colored asset markers (green = operational, amber = warning, red = critical, grey = offline). Click the red **UPS-A1** marker on B1 to pop its live telemetry; toggle the *Camera* layer to isolate surveillance coverage.
- **Copilot** — ask *"Why is risk level high today?"* and watch a grounded answer stream in with a risk breakdown, citation chips and follow-up prompts.
- **Risk Engine** — drag the what-if simulator to "restore the offline camera" and see the composite score fall in real time.
- **Predictive Maintenance** — a ranked asset table with health bars; **UPS-A1** at 41% health, **4 days** to predicted failure, ~$37K exposure mitigated.
- **Emergency Center** — hit *Simulate* on the **Fire — Primary Data Center** scenario and watch an 8-step automated+human playbook animate to a 240-minute recovery estimate.
- **Executive Dashboard** — 30 days of risk, alarms, energy and health trends with donut distributions, board-ready.

---

## 🏗️ Tech stack

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | **Next.js 14** (App Router) | Server components, routing, build pipeline |
| Language | **TypeScript 5.4** | End-to-end type-safe data contracts |
| Styling | **TailwindCSS 3.4** | Custom dark "command center" design system + glassmorphism |
| 3D | **Three.js 0.160** via **@react-three/fiber** + **drei** | Interactive digital twin |
| Animation | **Framer Motion 11** | Micro-interactions, staggers, gauge & bar animations |
| Charts | **Recharts 2.12** | Trend, area, bar and donut visualizations |
| Icons | **lucide-react** | Consistent line iconography |
| AI layer | **Deterministic mock engine** (TypeScript) | Risk scoring, predictive maintenance, copilot intent engine |
| Backend (optional) | **Node.js + Express + PostgreSQL** | Reference REST API mirroring the frontend contracts |

> No external AI APIs, no telemetry, no database are required to run the demo. The frontend is fully self-contained.

---

## 📁 Monorepo structure

```
Dubai Police/
├── README.md                 ← you are here
├── frontend/                 ← Next.js 14 app — the executive demo (self-contained)
│   ├── app/                  ← App Router routes (the 7 modules)
│   ├── components/           ← UI kit, charts, 3D twin, layout, panels
│   └── lib/                  ← types, mock data, AI engine, utils, nav
├── backend/                  ← Optional Express + PostgreSQL reference API
│   ├── src/                  ← routes, controllers, db access
│   └── db/                   ← schema.sql + seed
└── docs/                     ← this documentation suite
    ├── INSTALLATION.md
    ├── DEMO_WALKTHROUGH.md
    ├── ARCHITECTURE.md
    ├── API.md
    ├── DATA_MODEL.md
    ├── SCREENSHOTS.md
    └── ROADMAP.md
```

---

## 🚀 Quickstart

The frontend is the demo. It runs with **zero configuration and no database**.

```bash
# 1. Frontend (the executive demo)
cd frontend
npm install
npm run dev
# → open http://localhost:3000
```

That's it. Open **http://localhost:3000** and you land on the Command Center.

```bash
# Optional: type-check / production build
npm run typecheck
npm run build && npm start
```

> Need the backend too? It is entirely optional and runs standalone (it even degrades to **in-memory mode** with `USE_DB=false`, so PostgreSQL is optional as well). See [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

**Requirements:** Node.js **18+** and npm. (PostgreSQL 14+ only if you run the backend *with* a database.)

---

## 📚 Documentation

| Doc | What's inside |
|-----|---------------|
| [Installation](docs/INSTALLATION.md) | Prerequisites, frontend + optional backend setup, env vars, ports, troubleshooting, production build. |
| [Demo Walkthrough](docs/DEMO_WALKTHROUGH.md) | An 8–12 minute executive demo script: the exact click-path through all 7 modules, what to say, and live copilot questions to ask. |
| [Architecture](docs/ARCHITECTURE.md) | Layered architecture (Mermaid + ASCII), data flow, the deterministic-mock-AI rationale, folder tree, design decisions, and how it extends to real BMS/VMS/ACS/IoT. |
| [API Reference](docs/API.md) | Every backend endpoint, params, and example request/response JSON. In-memory vs DB modes. |
| [Data Model](docs/DATA_MODEL.md) | Domain entities, an ER diagram, and the PostgreSQL schema summary. |
| [Screenshots / Visual Spec](docs/SCREENSHOTS.md) | Narrated, screenshot-by-screenshot description of every screen. |
| [Roadmap](docs/ROADMAP.md) | Phased path to live integrations, real ML models, and city-scale federation. |

---

## 👥 Who it's for

- **Executives & command staff** — a board-ready, single-glance operating picture of a critical facility.
- **Innovation labs & smart-city programs** — a credible, runnable reference for facility-twin + AI concepts.
- **Security & critical-infrastructure organizations** — a blueprint for fusing BMS, VMS, ACS, power, fire and IoT under one explainable AI layer.
- **Solution architects & integrators** — typed data contracts and a reference REST API to build against.

---

## ⚠️ A note on the data

All telemetry, alarms, asset health, risk scores, predictions and copilot answers in this build are **simulated by a deterministic mock engine** for demonstration. Nothing connects to a live building, no personal data is processed, and identical inputs always produce identical outputs (no `Math.random()` / `Date.now()` at render time — see [Architecture](docs/ARCHITECTURE.md)). The platform is architected so each mock module can be swapped for a real data source or ML model without changing the UI — the [Roadmap](docs/ROADMAP.md) describes exactly how.

<div align="center">

---

**POLICE TWIN AI** · Central Command HQ `PTX-HQ-01` · *Built as an executive product demonstration.*

</div>
