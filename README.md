# Fastify Microservice Starter

A production-ready TypeScript microservice starter template built with Fastify and NATS messaging system.

## Features

- ⚡ **Fastify** - Fast and low overhead web framework
- 🚀 **NATS** - High-performance messaging system for microservices
- 📦 **TypeScript** - Type-safe development
- 🐳 **Docker** - Containerized deployment
- 🔒 **Security** - Helmet, CORS, and rate limiting built-in
- 📝 **Logging** - Structured logging with Pino
- 🏥 **Health Checks** - Built-in health endpoint
- 🔄 **Graceful Shutdown** - Proper cleanup on termination

## Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Docker and Docker Compose (optional, for containerized setup)

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/irzix/fastify-microservice-starter-ts.git
cd fastify-microservice-starter-ts
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Start NATS server (using Docker):
```bash
docker run -d -p 4222:4222 -p 8222:8222 nats:2.10-alpine -js -m 8222
```

Or use the provided docker-compose:
```bash
docker-compose up nats -d
```

5. Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:3000`

### Production Build

1. Build the project:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

### Docker Deployment

Build and run with Docker Compose:
```bash
docker-compose up --build
```

This will start both NATS and the application service.

## Project Structure

```
├── src/
│   ├── index.ts              # Application entry point
│   ├── config.ts             # Configuration management
│   ├── routes/               # API routes
│   │   ├── index.ts
│   │   └── example.ts
│   ├── services/             # Business logic services
│   │   └── nats.ts          # NATS client wrapper
│   ├── handlers/            # NATS message handlers
│   │   └── example.handler.ts
│   └── utils/               # Utility functions
│       └── logger.ts
├── dist/                    # Compiled JavaScript (generated)
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and uptime.

### Example Endpoints
```
GET  /api/v1/example
POST /api/v1/example/publish
POST /api/v1/example/request
```

## NATS Integration

The starter includes a NATS client wrapper with the following capabilities:

- **Publish**: Send messages to NATS subjects
- **Subscribe**: Listen to messages on specific subjects
- **Request/Reply**: Synchronous request-response pattern
- **Auto-reconnect**: Automatic reconnection with configurable retries

### Example Usage

#### Publishing a message:
```typescript
await natsClient.publish('example.subject', { data: 'value' });
```

#### Subscribing to messages:
```typescript
natsClient.subscribe('example.subject', async (data, reply) => {
  // Handle message
});
```

#### Request/Reply:
```typescript
const response = await natsClient.request('example.request', { query: 'data' });
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | CORS allowed origin | `*` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW` | Rate limit time window | `1 minute` |
| `NATS_SERVERS` | NATS server URLs (comma-separated) | `nats://localhost:4222` |
| `NATS_RECONNECT_TIME_WAIT` | Reconnect delay (ms) | `2000` |
| `NATS_MAX_RECONNECT_ATTEMPTS` | Max reconnection attempts | `10` |
| `LOG_LEVEL` | Logging level | `info` |

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Routes

1. Create a new route file in `src/routes/`
2. Register it in `src/routes/index.ts`

Example:
```typescript
// src/routes/my-route.ts
export async function myRoutes(server: FastifyInstance) {
  server.get('/my-endpoint', async () => {
    return { message: 'Hello' };
  });
}
```

### Adding NATS Handlers

1. Create a handler file in `src/handlers/`
2. Call the setup function in `src/index.ts`

Example:
```typescript
// src/handlers/my.handler.ts
export function setupMyHandlers() {
  natsClient.subscribe('my.subject', async (data) => {
    // Handle message
  });
}
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

**irzix**

- GitHub: [@irzix](https://github.com/irzix)
