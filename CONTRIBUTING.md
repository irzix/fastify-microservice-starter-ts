# Contributing

Contributions are welcome! Whether it's a bug fix, new feature, documentation improvement, or benchmark result — we appreciate your help.

## Getting Started

1. Fork and clone:
```bash
git clone https://github.com/<your-username>/fastify-microservice-starter-ts.git
cd fastify-microservice-starter-ts
```

2. Install dependencies:
```bash
npm install
```

3. Start NATS:
```bash
docker compose up nats -d
```

4. Run dev server:
```bash
npm run dev
```

## Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run checks:
```bash
npm run lint
npm run build
npm test
```
4. Commit with a clear message
5. Push and open a Pull Request

## Guidelines

- **TypeScript only** — all new code must be TypeScript with ESM imports (`.js` extensions)
- **Keep it lean** — avoid adding unnecessary dependencies
- **Test your changes** — add or update tests in `src/__tests__/`
- **Follow existing patterns** — match the code style already in the project
- **Run lint** — `npm run lint` must pass with no errors

## Ideas for Contributions

- Additional NATS patterns (JetStream, key-value store)
- Schema validation examples (Fastify JSON Schema or Zod)
- OpenTelemetry / tracing integration
- More benchmark scenarios
- Documentation improvements
- Bug fixes and performance improvements

## Pull Request Checklist

- [ ] Code follows the project style
- [ ] Tests added/updated and passing
- [ ] Build succeeds (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] README updated if needed

Thank you for contributing!
