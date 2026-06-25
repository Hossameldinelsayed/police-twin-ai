# Screens & Visual Specification

Real PNG captures are not bundled with this repository. Instead, this document **narrates each screen as if describing a screenshot** — what's on it, the layout, the standout visual elements and the "wow" factor. It doubles as the **visual spec / caption set** for the platform.

**Shared visual language.** Every screen uses the same dark "command center" aesthetic: a deep navy/near-black background, **glassmorphic** cards (`rounded-2xl`, hairline `white/6%` borders, soft inner sheen), a **cyan** accent (`command`) for data and a **violet** accent (`cognition`) reserved for AI. Numbers render in a tabular monospace (JetBrains Mono); body text is Inter. Accents carry soft glows; cards animate in with subtle fade-and-rise; live elements pulse. Risk colors run low→severe (green → amber → orange → red).

---

## Module 01 — Executive Command Center (`/`)

**The hero screen.** This is what leadership sees first.

- **Header row:** an eyebrow label *"Module 01 · Executive Command Center"*, the title *"Situational Overview"*, and a subtitle naming **Central Command HQ**. A pulsing **LIVE** badge and a "Synced · HH:MM GST" chip sit at the right.
- **AI Situation Brief (the standout):** a full-width **violet glass banner** with a soft violet glow and a `Brain` icon. It carries a *"AI Situation Brief"* label, an **88% confidence** chip, and a paragraph of AI-written prose declaring facility risk **High (~64/100)**, up over the week, driven by *critical power and access faults*. Below it, a highlighted **Priority action** line. A *"Ask the Copilot →"* button anchors the right edge.
- **KPI grid:** six glassmorphic **KPI cards** that animate in with a stagger — Facility Risk (red/amber), Active Alarms (orange), Energy Today vs baseline (cyan, with a delta arrow), Occupancy (violet), Security Status (emerald/amber/red word value), Maintenance (amber, with overdue + predicted-failure footnote). Each shows an icon, a label, a large animated number and a context footer.
- **Three-up middle band:**
  - **AI Risk Breakdown** — an animated **270° risk gauge** sweeping to the score, with the category colored beneath, plus four thin domain bars (equipment / security / energy / occupancy) showing each sub-score and point contribution.
  - **Energy & Environment** — a 24-hour **area chart** of actual consumption vs the AI baseline, with a *"+X% vs baseline"* chip and three stat tiles (live draw kW, today kWh, anomaly = "HVAC plant").
  - **Active Alarms** — a scrollable live **alarm feed** of the most urgent incidents, each with a severity dot, title, location and relative time.
- **Predictive + Occupancy band:** a wide **priority-assets** panel (ranked rows with tag, name, a colored health bar, days-to-failure and a status chip; footer shows avg fleet health and total downtime exposure mitigated) beside an **Occupancy by Floor** panel (one labeled bar per floor, turning orange above 85%).
- **Module launchpad:** a 6-tile grid linking to every other module, each tile a glass card with an icon, label, description and a hover *"Open →"*.
- **Digital-twin teaser:** a full-width glass strip with a `Boxes` icon and a live *"N/N assets live"* chip inviting a click into the 3D model.

**Wow factor:** an entire critical facility's posture — security, energy, occupancy, infrastructure — distilled into one glance, with the AI's reasoning and confidence printed right on top.

---

## Module 02 — Interactive Digital Twin (`/digital-twin`)

**The showpiece.** A genuinely interactive 3D model, not a render.

- **The scene:** six translucent **floor slabs** stacked vertically (B1 Plant at the bottom up to L5 Secure Core), each dotted with **asset markers** placed at their real zone positions. Marker color encodes status — **green** operational, **amber** warning, **red** critical, **grey** offline. The camera floats over a dark gradient stage; the whole thing is orbit/pan/zoom controllable. A brief *"Initializing digital twin…"* loader precedes it (the viewer is client-only / WebGL).
- **Left control rail:** a **floor selector** (each floor a button with its asset count), a building-wide view, and a **status legend**.
- **Layer toggles:** per-category visibility switches (HVAC, UPS, Electrical, Fire, Camera, Access Control, Sensor, Network) with eye / eye-off icons, so operators can isolate a single system — e.g. show only surveillance coverage.
- **Asset detail panel:** clicking a marker opens a glass panel with the asset's tag, name, manufacturer/model, a **health bar**, its status badge, install/service dates and a **live telemetry** readout (e.g. for a UPS: battery %, load %, runtime, input voltage).

**Wow factor:** clicking the **red UPS-A1 marker on B1** and seeing the exact same asset the AI flagged on the Command Center — now in physical, spatial context with its live telemetry. Peeling the building apart by system is the moment audiences lean in.

---

## Module 03 — AI Copilot (`/copilot`)

**Conversational facility intelligence, grounded and cited.**

- **Layout:** a chat surface in a tall glass card. Empty state shows a violet `Bot` hero and a grid of **suggested questions** as clickable chips ("Why is risk level high today?", "Show active alarms.", "Which assets require maintenance?", …).
- **A response:** the user's question appears as a right-aligned bubble; the AI reply is a richly formatted card — a bolded **answer** sentence, a list of **evidence bullets** (each citing a domain/asset with numbers), a row of **citation chips** (label → value, e.g. *"Risk score · 64/100 (High)"*), and a set of **follow-up** prompt chips beneath.
- **Tone:** executive, confident, specific — never generic. Severity and key figures are emphasized inline.

**Wow factor:** asking *"Why is risk level high today?"* and getting a precise, **cited** breakdown that matches the gauge on the Command Center exactly — proof the copilot reasons over the same live state, not a canned script.

---

## Module 04 — AI Risk Engine (`/risk-engine`)

**The explainable model, laid bare — plus a sandbox.**

- **Headline:** the composite **risk gauge** and category, with the 7-day trend delta.
- **Four domain cards:** Equipment & Infrastructure (**40%**), Security & Access (**30%**), Energy & Environment (**16%**), Occupancy & Movement (**14%**) — each showing its weight, 0–100 sub-score, point contribution, a trend arrow, a plain-English `detail`, and an expandable list of **named signals** (e.g. *"1 asset(s) in critical state (UPS-A1)"*, *"Surveillance coverage gap from offline camera"*).
- **Recommendations:** a prioritized list, each with a priority badge, the action, its rationale and an **estimated risk reduction** (e.g. *"−11 pts"*).
- **What-If Simulator (the standout):** interactive controls (toggles / sliders) for candidate mitigations — restore the offline camera, replace the UPS battery, resolve the energy anomaly. As you adjust them, the composite score and gauge **recompute live**, projecting the post-action risk.
- **30-day trend:** a line/area chart showing risk ramping over the last week toward the current elevated state.

**Wow factor:** the simulator. Watching the score fall as you "make decisions" turns an abstract risk number into an interactive, defensible planning tool.

---

## Module 05 — Predictive Maintenance (`/predictive-maintenance`)

**From reactive repair to predicted failure — quantified.**

- **Summary KPIs:** assets at risk, count critical, **predicted failures within 7 days**, average fleet health, and **total downtime cost avoided**.
- **Ranked asset table (the core):** assets sorted by urgency. Each row shows tag + name, floor, a colored **health bar**, **days-to-failure** (red when ≤7), **failure probability**, status chip and a one-line recommendation. The top row is **UPS-A1 — 41% health, ~4 days to failure**.
- **Driver signals:** expanding a row reveals the AI's evidence (e.g. for the UPS: *battery cell temperature above threshold*, *internal resistance rising*).
- **Filters:** by category and status (e.g. isolate power assets, or just the overdue items).
- **Work orders:** the maintenance backlog — predictive / preventive / corrective — each with priority, technician, estimated hours, cost estimate and schedule, including the **overdue** UPS battery replacement.

**Wow factor:** the **cost-avoided** framing. Pairing a 4-day failure prediction with a dollar figure for downtime exposure mitigated speaks directly to the budget holder.

---

## Module 06 — Emergency Center (`/emergency`)

**Rehearse the crisis before it's real.**

- **Scenario picker:** four cards — **Fire — Primary Data Center**, **Power Outage — Utility Mains Failure**, **Unauthorized Access — Evidence Vault**, **Equipment Failure — Cooling Loss** — each with a type icon, severity badge and a one-line description.
- **Trigger narrative:** on selection, the detection story (e.g. *"VESDA aspirating detector + thermal camera correlate a smoke signature at rack row C"*).
- **Impacted zones:** a list of affected zones with **severity-graded impact** chips (severe / major / moderate / minor) and their floor.
- **Response playbook (the standout):** an **animated, ordered timeline** of steps that reveal sequentially when you hit *Simulate*. Each step is tagged **automated** (cyan) or **human** (amber), names the actor (Fire Detection AI, BMS, Access Control, Suppression System, Watch Commander, Fire Brigade…), the action, and an **ETA in minutes**.
- **Outcome panel:** estimated recovery time (e.g. **240 min** for fire), affected assets, affected occupants, and a **cascade-risks** list of second-order consequences.

**Wow factor:** the automated-vs-human choreography animating step by step — and the directness of *"Watch Commander authorizes discharge if confirmed."* It reads like a real, rehearsable command playbook.

---

## Module 07 — Executive Dashboard (`/dashboard`)

**The board-ready trend and distribution layer.**

- **30-day trend charts:** four time-series — **risk**, **alarms**, **energy** and **asset health** — rendered as smooth line/area charts. Risk visibly **ramps over the last week**, mirroring the Command Center's narrative.
- **Distribution donuts:** **Energy mix** (HVAC dominant, then IT/Data Center, Lighting, Security & Other), **Alarms by type**, and **Assets by category** — each a donut with a center label and a legend.
- **24h occupancy curve:** the building's daily occupancy profile, peaking mid-afternoon.
- **Layout:** a clean grid of glass cards with section titles and subtle hover lift — designed to read at a glance on a wall display or in a slide.

**Wow factor:** the long-view continuity. The same UPS / camera / vault storyline that played out across the other six modules resolves here as a 30-day trend you can hand to a board.

---

## Cross-cutting UI elements

| Element | Where it appears | Visual signature |
|---------|------------------|------------------|
| **Sidebar / nav** | All screens | Glass rail listing the 7 modules with icons; active item highlighted in cyan. Collapses to a mobile nav on small screens. |
| **KPI card** | Command Center, Dashboard | Glass card, icon, label, large animated tabular number, colored delta, footer. |
| **Risk gauge** | Command Center, Risk Engine | Animated 270° arc that sweeps to the score, colored by category. |
| **Health bar** | Twin, Predictive, Risk | Thin animated bar, color-graded by health %. |
| **Alarm feed** | Command Center, Emergency | Stacked incident rows with severity dots, source and relative time. |
| **Badges / chips** | Everywhere | Severity, status, live and pill chips in domain colors. |
| **Glass cards** | Everywhere | `rounded-2xl`, hairline borders, sheen, soft accent glow, fade-in-up entrance. |
