# Order Supervisor POC - Backend

A production-grade, event-driven Order Supervision backend built with **Python 3.11+**, **FastAPI**, **Temporal Python SDK**, **PostgreSQL**, **SQLAlchemy 2.0**, **Pydantic v2**, and **OpenAI/LLM provider abstraction**.

---

## 🏗️ Architecture

```text
                        FRONTEND / API CLIENTS
                                  │
                                  ▼
                             FastAPI API
                                  │
            ┌─────────────────────┼────────────────────┐
            │                     │                    │
            ▼                     ▼                    ▼
       PostgreSQL          Temporal Client          Services
                                  │
                                  ▼
                          Temporal Workflow
                     (order-supervisor-{order_id})
                                  │
            ┌─────────────────────┼────────────────────┐
            │                     │                    │
         Signals                Timers             Activities
     (order_event, pause,     (workflow.sleep)     (run_agent, execute_action,
      resume, interrupt,                           persist_activity, update_memory,
      terminate, etc.)                             generate_final_summary)
            │                     │                    │
            └─────────────────────┼────────────────────┘
                                  ▼
                            Agent Runtime
                                  │
                        ┌─────────┴─────────┐
                        ▼                   ▼
                    LLM Provider          Tools (Business Actions)
                        │                   │
                        └─────────┬─────────┘
                                  ▼
                           Activity Log & DB
```

### Key Architectural Guarantees:
1. **One Workflow Per Order**: Each order runs a dedicated Temporal workflow (`order-supervisor-{order_id}`).
2. **Deterministic Execution**: Deterministic Temporal workflow code. Side effects belong strictly in Activities.
3. **Event-Driven & Scheduled Wake-Ups**: Receives signals via `@workflow.signal` and schedules durable timers via `workflow.sleep()`.
4. **Resilient AI Execution**: LLM failures trigger safe fallback heuristics without terminating the long-running workflow.
5. **Workflow Finalization**: Terminal order events (`delivered`) trigger summary, learnings, and recommendations generation before completing.

---

## 🛠️ Prerequisites

- **Python 3.11+**
- **Docker & Docker Compose** (for PostgreSQL & Temporal Server)

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_DB` | `ordersupervisor` | Database name |
| `TEMPORAL_HOST` | `localhost:7233` | Temporal server address |
| `LLM_PROVIDER` | `openai` | LLM Provider (`openai`, `mock`, `fallback`) |
| `OPENAI_API_KEY` | `""` | OpenAI API Key (optional; safe fallback used if omitted) |

---

## 🚀 Quickstart Guide

### Option 1: Full Stack via Docker Compose (Recommended)

Start PostgreSQL, Temporal, Temporal Web UI, Backend API, and Temporal Worker with a single command:

```bash
docker compose up --build
```

- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Temporal Web UI**: [http://localhost:8080](http://localhost:8080)

---

### Option 2: Local Development Setup

#### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 2. Start PostgreSQL & Temporal Server

```bash
docker compose up -d postgres temporal temporal-ui
```

#### 3. Run Database Migrations

```bash
alembic upgrade head
```

#### 4. Start Temporal Worker

```bash
python app/temporal/worker.py
```

#### 5. Start FastAPI Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 Testing

Run the automated Pytest test suite:

```bash
pytest
```

The test suite validates:
- **Wake Policy**: Priority evaluation for high-priority, normal, terminal, and ignored events.
- **Agent Runtime**: Decisions (`ACT`, `SLEEP`, `COMPLETE`), structured JSON parsing, and LLM failure recovery.
- **Temporal Workflow**: Signal handling (`order_event`, `add_instruction`, `pause`, `resume`, `terminate`), status queries, and idempotency.
- **API Endpoints**: Full lifecycle workflow from supervisor creation to run completion and queries.

---

## 🎬 Demo Workflow

### 1. Create a Supervisor Definition

```http
POST /api/supervisors
Content-Type: application/json

{
  "name": "E-Commerce Order Supervisor v1",
  "base_instruction": "Supervise fulfillment, alert logistics on delay, notify customer on failure.",
  "available_actions": [
    "message_fulfillment_team",
    "message_payments_team",
    "message_logistics_team",
    "message_customer",
    "create_internal_note"
  ]
}
```

### 2. Start an Order Supervision Run

```http
POST /api/runs
Content-Type: application/json

{
  "order_id": "ORDER-1001",
  "supervisor_id": "<SUPERVISOR_ID>",
  "order_context": {
    "customer_id": "CUST-99",
    "items": [{"sku": "LAPTOP-01", "qty": 1}]
  }
}
```

### 3. Inject an Incoming Order Event (Signal)

```http
POST /api/runs/<RUN_ID>/events
Content-Type: application/json

{
  "event_id": "evt_ship_delay_01",
  "event_type": "shipment_delayed",
  "payload": {
    "carrier": "FedEx",
    "reason": "Severe weather delay at hub"
  },
  "source": "logistics_webhook"
}
```

### 4. Inject a Manual Instruction

```http
POST /api/runs/<RUN_ID>/instructions
Content-Type: application/json

{
  "instruction": "Contact logistics manager directly and apply $10 credit note.",
  "added_by": "support_agent_sam"
}
```

### 5. Send Terminal Delivery Event

```http
POST /api/runs/<RUN_ID>/events
Content-Type: application/json

{
  "event_id": "evt_delivered_01",
  "event_type": "delivered",
  "payload": {
    "signed_by": "John Doe"
  }
}
```

---

## 🔍 API Summary

```http
POST /api/supervisors                # Create Supervisor
GET  /api/supervisors                # List Supervisors
GET  /api/supervisors/{id}           # Get Supervisor Details

POST /api/runs                       # Start Order Supervision Run
GET  /api/runs                       # List Runs
GET  /api/runs/{run_id}              # Get Run Status & Summary
GET  /api/runs/{run_id}/timeline     # Get Run Timeline Items
GET  /api/runs/{run_id}/activities   # Get Detailed Activity Log Entries
GET  /api/runs/{run_id}/memory       # Get Compact Memory Summary

POST /api/runs/{run_id}/events       # Inject Order Event (Signal)
POST /api/runs/{run_id}/instructions # Inject Human Instruction (Signal)

POST /api/runs/{run_id}/pause        # Pause Supervision
POST /api/runs/{run_id}/resume       # Resume Supervision
POST /api/runs/{run_id}/interrupt    # Interrupt Supervision
POST /api/runs/{run_id}/terminate    # Terminate Workflow
```

---

## 🛠️ Troubleshooting

- **Temporal connection error**: Ensure Temporal server is running on `localhost:7233` (or `temporal:7233` inside Docker).
- **Missing OpenAI Key**: The system automatically uses `FallbackLLMProvider` so all workflows and tests continue running seamlessly without failing.
