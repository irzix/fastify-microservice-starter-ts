# Fastify Microservice Starter

[![CI](https://github.com/irzix/fastify-microservice-starter-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/irzix/fastify-microservice-starter-ts/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
[![Fastify](https://img.shields.io/badge/fastify-5.x-black)](https://fastify.dev)

A **lean**, production-ready microservice boilerplate built with **Fastify 5**, **NATS** messaging, and a lightweight **Saga Orchestrator**. Zero bloat — only the essentials.

## Why This Starter?

- **Fastify 5.x** — latest version, fastest Node.js web framework
- **NATS** — lightweight, high-performance messaging for microservice communication
- **Saga Orchestrator** — built-in orchestration pattern for distributed transactions
- **TypeScript + ESM** — modern, type-safe, native ES modules
- **Request validation** — with TypeBox schemas
- **Structured error handling** — consistent JSON error responses
- **Request tracing** — automatic `x-request-id` on every request
- **Graceful shutdown** — with configurable timeout
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
├── core/                # ⚙️ Core framework & config
│   ├── config.ts        # Environment configuration
│   ├── logger.ts        # Pino logger instance
│   └── plugins/         # Fastify plugins
│       ├── error-handler.ts # Structured JSON errors
│       └── request-id.ts    # x-request-id tracing
├── messaging/           # 📨 Inter-service communication
│   ├── nats.ts          # NATS client wrapper
│   └── saga.ts          # Lightweight Saga Orchestrator
├── modules/             # ⭐️ Business feature modules (Vertical Slices)
│   ├── health/          # Healthcheck module
│   │   └── health.routes.ts
│   └── order/           # Saga implementation demo
│       ├── order.routes.ts
│       └── order.saga.ts
├── app.ts               # Fastify app configuration
├── index.ts             # Main entry point (starts server)
├── bench.ts             # Benchmark script
└── __tests__/
    ├── health.test.ts
    └── saga.test.ts
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

```text
GET  /health                      → Health check + NATS status
POST /api/v1/order                → Trigger order saga (demo)
```

## Saga Pattern

The built-in Saga Orchestrator provides a clean way to manage distributed transactions across microservices. If any step fails, all previously executed steps are automatically compensated in reverse order.

### How It Works

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Step 1:    │───▶│  Step 2:    │───▶│  Step 3:    │
│  Reserve    │    │  Charge     │    │  Confirm    │
│  Inventory  │    │  Payment    │    │  Order      │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │     On Failure:  │                  │
       ◀──────────────────◀──────────────────┘
  compensate         compensate
  (release)          (refund)
```

### Define a Step

```typescript
import type { SagaStep } from './saga/index.js';

const reserveInventory: SagaStep<MyContext> = {
  name: 'reserve-inventory',

  async execute(ctx) {
    // Forward action: reserve items
    await inventoryService.reserve(ctx.items);
    ctx.inventoryReserved = true;
  },

  async compensate(ctx) {
    // Rollback: release reserved items
    await inventoryService.release(ctx.items);
    ctx.inventoryReserved = false;
  },
};
```

### Create & Run a Saga

```typescript
import { SagaOrchestrator } from './saga/index.js';

const saga = new SagaOrchestrator('create-order', [
  reserveInventory,
  chargePayment,
  confirmOrder,
]);

const result = await saga.run({
  orderId: 'ord_123',
  userId: 'usr_456',
  items: [{ productId: 'p1', qty: 2 }],
  totalAmount: 49_99,
});

if (result.success) {
  console.log('Order created:', result.context);
} else {
  console.error('Saga failed at step', result.failedAt, result.error);
}
```

### SagaResult

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether all steps completed |
| `context` | `T` | Final context after execution |
| `failedAt` | `number?` | Step index that failed |
| `error` | `Error?` | Original error from failing step |
| `compensationErrors` | `Array?` | Compensation failures (if any) |

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

## Plugins

### Error Handler

Consistent JSON error responses with automatic log-level selection:

```json
{
  "statusCode": 400,
  "error": "ValidationError",
  "message": "body/orderId must be string",
  "requestId": "a1b2c3d4-..."
}
```

### Request ID

Every response includes an `x-request-id` header. If the client sends one, it's reused; otherwise a UUID is generated.

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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `NODE_ENV` | `development` | Environment |
| `CORS_ORIGIN` | `*` | CORS allowed origin |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW` | `1 minute` | Rate limit window |
| `SHUTDOWN_TIMEOUT` | `10000` | Graceful shutdown timeout (ms) |
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

### Add a Saga

```typescript
// src/sagas/payment-saga.ts
import type { SagaStep } from '../saga/index.js';
import { SagaOrchestrator } from '../saga/index.js';

interface PaymentCtx extends Record<string, unknown> {
  amount: number;
  captured?: boolean;
}

const capturePayment: SagaStep<PaymentCtx> = {
  name: 'capture',
  async execute(ctx) { ctx.captured = true; },
  async compensate(ctx) { ctx.captured = false; },
};

export const paymentSaga = new SagaOrchestrator<PaymentCtx>(
  'payment', [capturePayment]
);
```

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node.js 22+ |
| Framework | Fastify 5 |
| Messaging | NATS |
| Saga | Built-in Orchestrator |
| Validation | TypeBox |
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
