# Executive Demo Walkthrough

**Audience:** executives, command staff, innovation leadership, evaluators.
**Duration:** 8–12 minutes.
**Goal:** show a single intelligent pane of glass over a critical police facility — and prove the AI is explainable, predictive and actionable.

> **Setup before you present:** `cd frontend && npm install && npm run dev`, then open **http://localhost:3000** full-screen. Everything is deterministic — the numbers below will match what you see. No internet, database or login required.

---

## The narrative arc

You're walking through **Central Command HQ (`PTX-HQ-01`)** — a 6-level, ~42,800 m² police headquarters with ~48 building assets — on a day where things are *not* quiet. Risk is elevated. The demo shows how the platform (1) **detects** it, (2) **explains** it, (3) **predicts** what's coming, (4) lets you **rehearse the response**, and (5) lets you just **ask**.

| Stop | Module | Time | The line that lands |
|------|--------|------|---------------------|
| 1 | Command Center (`/`) | 0:00–2:00 | "One screen, the whole building." |
| 2 | Risk Engine (`/risk-engine`) | 2:00–4:00 | "The AI shows its work — and lets you simulate fixes." |
| 3 | Predictive Maintenance (`/predictive-maintenance`) | 4:00–5:30 | "We catch failures days before they happen." |
| 4 | Digital Twin (`/digital-twin`) | 5:30–7:30 | "Now see it in 3D, asset by asset." |
| 5 | Emergency Center (`/emergency`) | 7:30–9:30 | "Rehearse the crisis before it's real." |
| 6 | AI Copilot (`/copilot`) | 9:30–11:00 | "Just ask the building." |
| 7 | Executive Dashboard (`/dashboard`) | 11:00–12:00 | "And brief the board with the trend." |

---

## Stop 1 — Command Center (`/`) · "One screen, the whole building"

**Open the app.** You land on the Executive Command Center.

**Point at the AI Situation Brief** (the violet banner at the top):
> "The first thing leadership sees is an AI-written brief. It's telling us facility risk is **High**, around **64 / 100**, up over the past week, driven by **critical power and access faults** — at **88% model confidence**. And it already names the priority action: replace the degraded UPS battery string."

**Sweep across the six KPI cards:**
> "Six numbers run the building — facility risk, active alarms, energy today vs the AI's own baseline, occupancy, security posture, and maintenance. Notice energy is running *above* baseline, and there's an after-hours occupancy flag."

**Point at the AI Risk Breakdown** (left, the animated gauge):
> "That risk score isn't a vibe — it's a weighted blend of four domains: equipment, security, energy and occupancy. The gauge and bars show exactly how much each one contributes."

**Glance at the Active Alarms feed and Predictive Maintenance highlights:**
> "On the right, the live incident stream. Below, the assets the AI is most worried about — already ranked by urgency."

**Business value:** *Decision-makers get the entire facility posture in one glance, with the AI's reasoning attached — no dashboard hunting.*

➡️ **Click "Details"** on the Risk Breakdown card (or "Risk Engine" in the sidebar).

---

## Stop 2 — Risk Engine (`/risk-engine`) · "The AI shows its work"

**Point at the four risk domains and their weights:**
> "Here's the model itself, fully transparent. Equipment is weighted **40%**, security **30%**, energy **16%**, occupancy **14%**. Each domain has a sub-score and — this is the key part — the **named signals** behind it. Equipment risk, for example, cites the critical UPS, the offline camera, and the predicted failures within 14 days."

**Scroll to the recommendations:**
> "The engine doesn't just score — it prescribes. Each recommendation carries a priority and an **estimated risk reduction in points**: restore the Dispatch camera and audit the vault logs, −7 points; replace the UPS battery, −11."

**Now the showpiece — the What-If Simulator:**
> "Watch this. Let me toggle 'restore the offline camera' and 'replace the UPS battery'…"
*(toggle / drag the simulator controls)*
> "…and the composite score drops in real time. Leadership can see the payoff of a decision **before** committing a crew."

**Business value:** *Explainable, auditable risk — and a sandbox to test mitigations before spending budget or people.*

➡️ **Click into Predictive Maintenance** (sidebar).

---

## Stop 3 — Predictive Maintenance (`/predictive-maintenance`) · "Days before it happens"

**Point at the top of the ranked asset table:**
> "These assets are sorted by urgency. **UPS-A1**, the primary power backup, is at **41% health** with a predicted failure in **4 days** — battery cells over temperature under load. That's not a guess after the fact; the AI is calling it now."

**Hover a row to show driver signals:**
> "Every prediction lists its driver signals — rising internal resistance, battery temperature over threshold — and a recommended action."

**Point at the cost-avoided / work-orders area:**
> "And here's the language executives care about: acting early **avoids tens of thousands in downtime exposure**. The platform even drafts the work orders — predictive, preventive, corrective — with technicians, hours and cost estimates."

**Use a filter** (by category or status):
> "Filter to just power, or just the overdue items — whatever the conversation needs."

**Business value:** *Shift from reactive repair to predictive maintenance — quantified in dollars and downtime.*

➡️ **Open the Digital Twin** (sidebar).

---

## Stop 4 — Digital Twin (`/digital-twin`) · "See it in 3D"

**Let the 3D model load** (a brief "Initializing digital twin…").

> "This is the actual facility — six floors, from the B1 plant up to the L5 Secure Core, with the ~48 assets placed where they physically live."

**Orbit and zoom** with the mouse:
> "Fully interactive — orbit, pan, zoom. Marker colors are status: green operational, amber warning, **red critical**, grey offline."

**Click the red UPS-A1 marker on B1:**
> "Click any asset and you get its live telemetry — for the UPS, the battery percentage, load, runtime and input voltage. This is the same asset the AI just flagged, now in physical context."

**Toggle an asset layer** (e.g. turn Cameras on/off, or isolate Access Control):
> "And we can peel the building apart by system — show me only surveillance, or only access control — to reason about coverage and gaps."

**Select a floor** (e.g. L5 · Secure Core):
> "Jump to a single floor — here's the Secure Core: data center, evidence vault, armory."

**Business value:** *Spatial intelligence — operators reason about the building as it actually is, not as a spreadsheet.*

➡️ **Open the Emergency Center** (sidebar).

---

## Stop 5 — Emergency Center (`/emergency`) · "Rehearse the crisis"

**Show the four scenario cards:**
> "Four pre-modeled crises: a **fire** in the data center, a **utility power outage**, an **unauthorized access** attempt at the evidence vault, and a cascading **equipment / cooling failure**."

**Select "Fire — Primary Data Center (L5)" and hit Simulate:**
> "When I run it, the platform shows the impacted zones — severe in the data center, major in the evidence vault — and then animates the **response playbook**, step by step."

**Walk the animated playbook:**
> "Notice each step is tagged **automated** or **human**. The Fire Detection AI confirms the smoke signature at second zero; the BMS shuts down recirculation and closes dampers; access control releases egress doors and locks the vault; suppression arms with a 30-second countdown — *then* the Watch Commander authorizes discharge. Estimated recovery: **240 minutes**."

**Point at the cascade risks:**
> "And it surfaces the second-order risks — core service outage if failover lags, evidence-integrity exposure during discharge — so the team plans for them in advance."

> *(If time allows, run the "Unauthorized Access — Evidence Vault" scenario — it ties directly back to the after-hours occupancy anomaly and access denials we saw on the Command Center.)*

**Business value:** *Command teams can rehearse coordinated, multi-system responses and validate recovery times — before a real incident.*

➡️ **Open the AI Copilot** (sidebar).

---

## Stop 6 — AI Copilot (`/copilot`) · "Just ask the building"

**Click a suggested question or type:** `Why is risk level high today?`
> "The copilot answers from the *same live state* — risk is High at ~64, here's the breakdown by domain, with citation chips you can trust."

**Ask a follow-up:** `What are your recommended actions?`
> "It returns the prioritized mitigation list, with the combined point reduction."

**Then:** `Which assets require maintenance?`
> "Same grounded answer — UPS-A1, the chiller, the LV panel — with health and days-to-failure."

**Suggested live questions** (all answered from real state, with citations + follow-ups):

| Ask this | It demonstrates |
|----------|-----------------|
| `Why is risk level high today?` | Explainable risk reasoning |
| `Show active alarms.` | Live incident awareness |
| `Which assets require maintenance?` | Predictive grounding |
| `What happened during the last 24 hours?` | Event timeline recall |
| `How is energy consumption tracking?` | Energy + anomaly attribution |
| `What are your recommended actions?` | Prescriptive guidance |

**Business value:** *Natural-language access to facility intelligence — no training, no dashboards, fully cited.*

➡️ **Finish on the Executive Dashboard** (sidebar).

---

## Stop 7 — Executive Dashboard (`/dashboard`) · "Brief the board"

**Point at the 30-day trend charts:**
> "To close: the long view. Risk, alarms, energy and asset health over 30 days. You can see risk **ramping over the last week** — exactly the story the Situation Brief told at the start."

**Sweep the distribution donuts:**
> "Energy mix — HVAC dominates. Alarms by type. Assets by category. The board-ready snapshot."

**Business value:** *The trend and distribution layer for governance, reporting and budget conversations.*

---

## Closing line

> "Everything you saw — risk, predictions, the copilot, the emergency playbooks — ran on **one platform, with no database and no cloud dependency**, and every AI number traced back to a signal you could inspect. This is what it looks like when a critical facility can **think** — and tell you what it's thinking."

---

## Presenter tips

- **It's deterministic.** Rehearse confidently — the same numbers appear every run.
- **The story is connected.** The UPS-A1 failure, the offline Dispatch camera and the Evidence Vault access anomaly recur across Command Center → Risk Engine → Predictive Maintenance → Digital Twin → Emergency → Copilot. Call back to them; it reinforces that this is one coherent system, not seven disconnected screens.
- **If 3D is slow** on the demo machine, do the Digital Twin stop last or briefly — the rest is lightweight.
- **Short on time?** The minimum compelling path is **Command Center → Risk Engine (simulator) → Copilot**. That alone tells the explainable-AI story in ~5 minutes.
