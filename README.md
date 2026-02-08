# Fastify Microservice Starter

[![CI](https://github.com/irzix/fastify-microservice-starter-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/irzix/fastify-microservice-starter-ts/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
[![Fastify](https://img.shields.io/badge/fastify-5.x-black)](https://fastify.dev)

A **lean**, production-ready microservice boilerplate built with **Fastify 5** and **NATS** messaging. Zero bloat — only the essentials.

## Why This Starter?

- **5 production dependencies** — Fastify, NATS, Helmet, CORS, Rate Limit. That's it.
- **Fastify 5.x** — latest version, fastest Node.js web framework
- **NATS** — lightweight, high-performance messaging for microservice communication
- **TypeScript + ESM** — modern, type-safe, native ES modules
- **Built-in benchmarks** — measure performance out of the box with autocannon
- **Docker-ready** — multi-stage build, compose with NATS included
- **CI included** — GitHub Actions workflow ready to go

## Quick Start

```bash
# Clone
git clone https://github.com/irzix/fastify-microservice-starter-ts.git
cd fastify-microservice-starter-ts

# Install
npm install

# Start NATS
docker compose up nats -d

# Dev server
npm run dev
```

Server runs at `http://localhost:3000`

## Project Structure

```
src/
├── index.ts                 # Entry point + server builder
├── config.ts                # Environment configuration
├── bench.ts                 # Benchmark script
├── routes/
│   ├── index.ts             # Route registration
│   └── example.ts           # Example CRUD + NATS routes
├── handlers/
│   └── example.handler.ts   # NATS message handlers
├── services/
│   └── nats.ts              # NATS client wrapper
└── utils/
    └── logger.ts            # Pino logger instance
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run bench` | Run benchmarks (server must be running) |

## API Endpoints

```
GET  /health                  → Health check + NATS status
GET  /api/v1/example          → Example endpoint
POST /api/v1/example/publish  → Publish message to NATS
POST /api/v1/example/request  → NATS request/reply
```

## NATS Integration

The included NATS client wrapper supports:

```typescript
// Publish (fire-and-forget)
natsClient.publish('orders.created', { orderId: '123' });

// Request/Reply
const response = await natsClient.request('users.get', { id: '456' });

// Subscribe
natsClient.subscribe('orders.created', async (data) => {
  // Handle message
});
```

Features: auto-reconnect, graceful drain on shutdown, JSON codec built-in.

## Benchmarks

Start the server, then run:

```bash
npm run bench
```

Configurable via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BENCH_URL` | `http://localhost:3000` | Target URL |
| `BENCH_DURATION` | `10` | Duration in seconds |
| `BENCH_CONNECTIONS` | `100` | Concurrent connections |
| `BENCH_PIPELINING` | `10` | Requests per connection |

Example output:

```
Fastify Microservice Benchmark
URL: http://localhost:3000
Duration: 10s | Connections: 100 | Pipelining: 10

============================================================
  GET /health
============================================================
  Requests/sec:  50,000+
  Latency avg:   1.5 ms
  Latency p99:   5 ms
  Throughput:    10 MB/s
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `NODE_ENV` | `development` | Environment |
| `CORS_ORIGIN` | `*` | CORS allowed origin |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW` | `1 minute` | Rate limit window |
| `NATS_SERVERS` | `nats://localhost:4222` | NATS URLs (comma-separated) |
| `NATS_RECONNECT_TIME_WAIT` | `2000` | Reconnect delay (ms) |
| `NATS_MAX_RECONNECT_ATTEMPTS` | `10` | Max reconnect attempts |
| `LOG_LEVEL` | `debug` / `info` | Log level (debug in dev) |

Copy `.env.example` to `.env` to customize.

## Docker

```bash
# Full stack (NATS + app)
docker compose up --build

# Just NATS
docker compose up nats -d
```

## Extending

### Add a Route

```typescript
// src/routes/orders.ts
import type { FastifyInstance } from 'fastify';

export async function orderRoutes(server: FastifyInstance) {
  server.get('/orders', async () => ({ orders: [] }));
}
```

Register in `src/routes/index.ts`:

```typescript
import { orderRoutes } from './orders.js';

export function setupRoutes(server: FastifyInstance) {
  server.register(exampleRoutes, { prefix: '/api/v1' });
  server.register(orderRoutes, { prefix: '/api/v1' });
}
```

### Add a NATS Handler

```typescript
// src/handlers/order.handler.ts
import { natsClient } from '../services/nats.js';

export function setupOrderHandlers() {
  natsClient.subscribe('orders.created', async (data) => {
    // Process order
  });
}
```

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node.js 22+ |
| Framework | Fastify 5 |
| Messaging | NATS |
| Language | TypeScript (ESM) |
| Testing | Vitest |
| Benchmarks | autocannon |
| Linting | ESLint + typescript-eslint |
| Container | Docker (multi-stage) |
| CI | GitHub Actions |

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

## Author

**irzix** — [@irzix](https://github.com/irzix)
