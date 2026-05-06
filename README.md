# AI Todo App

A distributed AI-powered todo list application built with hexagonal architecture. Describe a goal and the AI generates a structured todo list for you. Check off items as you complete them — progress is persisted in real time.

## Architecture

```
┌─────────────┐     HTTP/REST      ┌─────────────────┐     gRPC (proto)    ┌──────────────────┐
│   Frontend  │ ─────────────────► │   API Service   │ ──────────────────► │  App Service     │
│  Vite/React │   localhost:3001   │   Express       │     port 50051      │  Business Logic  │
│  port 5173  │                    │   port 3001     │                     │  OpenAI + CH     │
└─────────────┘                    └─────────────────┘                     └──────────────────┘
                                                                                     │
                                                                                     ▼
                                                                           ┌──────────────────┐
                                                                           │   ClickHouse     │
                                                                           │   port 8123      │
                                                                           └──────────────────┘
```

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | Vite + React + TypeScript | UI, optimistic updates |
| API Service | Express + gRPC client | HTTP gateway, routes to app-service |
| App Service | gRPC server + OpenAI SDK | Business logic, AI generation, DB writes |
| Database | ClickHouse | Persistent storage for lists and items |

Communication between the API and App services uses Protocol Buffers over gRPC (`proto/todo.proto`).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose)
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Grafana Cloud](https://grafana.com/auth/sign-up/create-user) account for observability (traces, metrics, logs via Alloy)

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required keys:

```
OPENAI_API_KEY=sk-...

# From your Grafana Cloud stack → Details → OpenTelemetry
GRAFANA_OTLP_USERNAME=your-instance-id
GRAFANA_OTLP_API_KEY=your-api-key
```

### 2. Start all services

```bash
npm run demo:up
```

This builds and starts every service in order (ClickHouse → App Service → API Service → Frontend). First build takes a few minutes; subsequent starts are faster.

| URL | Service |
|---|---|
| http://localhost:5173 | Frontend |
| http://localhost:3001 | API Service (REST) |
| http://localhost:8123 | ClickHouse HTTP interface |

### 3. Stop and clean up

```bash
# Stop all containers (preserves database volume)
docker compose -f compose.yaml down

# Stop and delete all data
npm run demo:down
```

## Local Development (without Docker)

Run only ClickHouse in Docker and the two Node services locally for faster iteration with hot-reload.

### Start ClickHouse

```bash
npm run db:up
```

### Install dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### Start services

In three separate terminals:

```bash
# Terminal 1 — App Service (gRPC, port 50051)
npm run dev:app

# Terminal 2 — API Service (HTTP, port 3001)
npm run dev:api

# Terminal 3 — Frontend (Vite dev server, port 5173)
cd frontend && npm run dev
```

Both backend services watch for file changes and restart automatically via `tsx watch`.

### Stop ClickHouse

```bash
npm run db:down
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | **Required.** Your OpenAI API key |
| `GRAFANA_OTLP_USERNAME` | — | **Required.** Grafana Cloud instance ID (found under Stack → OpenTelemetry) |
| `GRAFANA_OTLP_API_KEY` | — | **Required.** Grafana Cloud API key with metrics/logs/traces write permissions |
| `PORT` | `3001` | HTTP port for the API service |
| `APP_SERVICE_URL` | `localhost:50051` | gRPC address of the app-service |
| `GRPC_PORT` | `50051` | gRPC port for the app-service |
| `CLICKHOUSE_URL` | `http://localhost:8123` | ClickHouse HTTP endpoint |
| `CLICKHOUSE_DB` | `todos` | ClickHouse database name |
| `CLICKHOUSE_USER` | `default` | ClickHouse username |
| `CLICKHOUSE_PASSWORD` | _(empty)_ | ClickHouse password |
| `VITE_API_URL` | `http://localhost:3001` | API base URL used by the frontend |

## Project Structure

```
.
├── proto/
│   └── todo.proto              # gRPC service contract
├── src/
│   ├── api-service/            # HTTP gateway (Express)
│   │   ├── grpc/               # gRPC client wrapper
│   │   ├── routes/             # REST route handlers
│   │   ├── server.ts
│   │   └── index.ts
│   └── app-service/            # Business logic (gRPC server)
│       ├── ai/                 # OpenAI adapter
│       └── todo/
│           ├── grpc/           # gRPC handler (driving adapter)
│           ├── repository/     # ClickHouse adapter (driven adapter)
│           ├── service/        # Domain service
│           ├── Todo.ts         # Domain entities
│           ├── TodoRepositoryPort.ts
│           └── AIGeneratorPort.ts
├── frontend/                   # Vite + React + TypeScript UI
│   └── src/
│       ├── components/
│       │   ├── PromptForm.tsx
│       │   ├── TodoListCard.tsx
│       │   └── TodoListDetail.tsx
│       ├── api.ts              # Fetch wrappers
│       ├── types.ts            # Shared TypeScript types
│       └── App.tsx
├── compose.yaml
├── Dockerfile                  # Shared image for api-service and app-service
└── .env.example
```

## API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/todo-lists` | Generate a new todo list from a prompt |
| `GET` | `/api/todo-lists` | List all todo lists |
| `GET` | `/api/todo-lists/:id` | Get a single todo list with items |
| `PATCH` | `/api/todo-items/:id` | Update an item's completion status |

### Example

```bash
# Generate a todo list
curl -X POST http://localhost:3001/api/todo-lists \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "Plan a weekend hiking trip"}'

# Mark an item as complete
curl -X PATCH http://localhost:3001/api/todo-items/<item-id> \
  -H 'Content-Type: application/json' \
  -d '{"completed": true}'
```
