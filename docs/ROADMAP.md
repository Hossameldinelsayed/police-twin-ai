# Product Roadmap

Ministry of Interior today is a self-contained, deterministic **demonstration** of an AI command center and digital twin. This roadmap describes how it evolves into a production platform — from live integrations, to real machine-learning models, to city-scale federation — while preserving the core promise: **explainable, single-pane-of-glass facility intelligence**.

The platform is deliberately built for this path. Every mock module sits behind a typed contract (see [ARCHITECTURE.md](ARCHITECTURE.md) §7), so each phase swaps *sources and models* without rewriting the experience.

---

## At a glance

| Phase | Theme | Horizon | Outcome |
|-------|-------|---------|---------|
| **1** | Live data integrations | Q1–Q2 | Real telemetry replaces mock data, in real time. |
| **2** | Real AI / ML models | Q2–Q3 | Learned anomaly detection, RUL prediction, and a true LLM copilot with RAG. |
| **3** | Scale, mobility & governance | Q3–Q4 | Multi-site federation, field/mobile apps, BIM-driven twins, RBAC, compliance and edge analytics. |

---

## Phase 1 — Live data integrations *(Q1–Q2)*

Connect the platform to the building's real operational systems. The frontend already supports pointing at a live API (`NEXT_PUBLIC_API_BASE_URL`), and the backend already has the matching contracts and a `USE_DB=true` mode — this phase wires the **source** end.

| Initiative | Integrates | Replaces in demo | Rationale |
|------------|-----------|------------------|-----------|
| **BMS / SCADA connector** | Building management & plant control (BACnet, Modbus, OPC-UA) | `telemetry.ts` energy, HVAC/electrical asset telemetry | The single largest live-data source: energy, cooling, power, environmental conditions. |
| **VMS integration** | Video management (Milestone, Genetec, Axis) | Camera assets & surveillance-gap signals | Bind twin markers to real cameras; deep-link live feeds into the Emergency Center video step. |
| **ACS integration** | Access control (HID, LenelS2, Gallagher) | Access alarms, occupancy anomalies | Real read/deny events and door states feed the security domain and intrusion scenarios. |
| **IoT / sensor ingestion** | Environmental, leak, IAQ, vibration sensors (MQTT) | `Sensor` assets, environmental alarms | High-frequency edge signals for anomaly detection. |
| **Fire & life-safety bus** | Fire panels (Siemens, Honeywell) | Fire alarms, fire scenarios | Life-safety events with the highest assurance requirements. |
| **Time-series backbone** | TimescaleDB / InfluxDB | In-code 24h & 30-day series | Durable historian for trends, baselines and replay. |
| **Streaming ingest** | Kafka / MQTT broker + normalizer | Static seeds | Normalize heterogeneous feeds into the `Asset` / `Alarm` / reading contracts. |

**Exit criteria:** the Command Center, Twin and Dashboard render from live, persisted facility data, with mock data retained only as a demo fallback.

---

## Phase 2 — Real AI / ML models *(Q2–Q3)*

Upgrade the deterministic mock engine to learned models — **without losing explainability**, which is non-negotiable in a security context.

| Initiative | Replaces | Approach | Rationale |
|------------|----------|----------|-----------|
| **Anomaly detection** | Hand-tuned energy/occupancy/security thresholds | Unsupervised + forecasting models on the time-series backbone (e.g. seasonal decomposition, autoencoders) | Catch novel anomalies the static rules miss; auto-learn each asset's normal. |
| **RUL / failure prediction** | `predictive.ts` heuristic (`predictedFailureDays`, `failureProbability`) | Per-asset-class remaining-useful-life models trained on telemetry + maintenance history | Move from rule-of-thumb to data-driven, calibrated predictions with confidence intervals. |
| **Hybrid risk model** | `risk.ts` fixed weights | Keep the weighted, auditable blend as the **baseline**; let learned signals contribute as additional, explainable inputs | Preserve transparency (the headline number stays traceable) while improving accuracy. |
| **LLM copilot + RAG** | `copilot.ts` intent engine | True LLM with retrieval-augmented generation over the live facility data, tools and history | Open-ended Q&A, multi-step reasoning, summarization — still **grounded and cited** against real entities. |
| **Model ops** | — | Versioning, evaluation, drift monitoring, human-in-the-loop feedback | Trust, auditability and safe rollout for AI in a critical environment. |

**Design guardrail:** every AI output must remain **explainable and cited**. Learned models augment — never replace — the auditable baseline that executives can interrogate.

**Exit criteria:** predictions and risk are model-driven with measured accuracy; the copilot answers free-form questions with citations to live data.

---

## Phase 3 — Scale, mobility & governance *(Q3–Q4)*

Take a single, productionized facility to many — and harden it for institutional deployment.

| Initiative | Capability | Rationale |
|------------|-----------|-----------|
| **Multi-site / city-scale federation** | Roll up many facilities into a regional or city command view; per-site drill-down | One operations center overseeing an entire estate — the smart-city endgame. |
| **Mobile & field apps** | Responsive + native apps for officers, technicians and commanders on the move | Push the Emergency playbooks and work orders to the people executing them. |
| **BIM / IFC-driven twins** | Import real building geometry (BIM/IFC) to replace the procedural slab model | Photoreal, survey-accurate twins per facility, generated from existing models. |
| **Role-based access & audit** | RBAC, SSO/IdP integration, immutable audit log of every action and AI decision | Mandatory for police/security: who saw what, who acted, and why the AI advised it. |
| **Compliance & data residency** | Configurable in-region/on-prem deployment, data-retention policy, privacy controls | Meet jurisdictional data-residency and evidence-handling requirements. |
| **Edge analytics** | Run anomaly detection / inference at the edge near sensors and cameras | Resilience to network loss, lower latency, reduced bandwidth and privacy exposure. |
| **Open integration API & webhooks** | Publish events to SOC/SIEM, dispatch and ITSM systems | Make the platform a hub in the wider security operations ecosystem. |

**Exit criteria:** multiple BIM-accurate sites under one federated, role-secured, compliant command view, with edge resilience and outbound integrations.

---

## Guiding principles across all phases

1. **Explainability first.** Every score, prediction and answer stays traceable to its inputs. No black boxes in a security command center.
2. **Contracts are forever.** The typed data model is the stable interface. Sources and models evolve behind it; the experience stays coherent.
3. **Graceful degradation.** Live integrations fail; the platform must keep operating (cached state, edge inference, the in-memory fallback that already exists today).
4. **Demo-grade always works.** The deterministic, offline build is preserved as a sales, training and disaster-recovery asset throughout.
5. **Security & compliance are features, not afterthoughts.** RBAC, audit and data residency are designed in, scheduled in Phase 3, and never bolted on.

---

## Beyond the roadmap (exploratory)

- **Prescriptive autonomy** — let the platform *execute* low-risk automated responses (load shedding, camera repositioning) under policy, with human override.
- **Cross-domain correlation** — fuse weather, traffic, and city-event feeds into risk (e.g. recovery-time estimates already model traffic for fire-brigade ETA — extend this).
- **Digital-twin simulation** — run "what-if" building simulations (occupancy surge, partial outage) against the BIM twin, not just pre-modeled scenarios.
- **Sustainability layer** — carbon and efficiency optimization built on the energy baseline the platform already computes.
