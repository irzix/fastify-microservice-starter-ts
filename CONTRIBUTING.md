# Contributing

Thank you for considering contributing to this project! We welcome contributions of all kinds.

## How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Setup

1. Clone your fork:
```bash
git clone https://github.com/your-username/fastify-microservice-starter-ts.git
cd fastify-microservice-starter-ts
```

2. Install dependencies:
```bash
npm install
```

3. Start NATS server:
```bash
docker-compose up nats -d
```

4. Run in development mode:
```bash
npm run dev
```

## Code Style

- Follow the existing code style
- Run `npm run lint` before committing
- Use TypeScript for all new code
- Write meaningful commit messages

## Testing

- Add tests for new features
- Ensure all tests pass: `npm test`
- Ensure the build succeeds: `npm run build`

## Pull Request Process

1. Update the README.md if needed
2. Ensure your code follows the project's style guidelines
3. Make sure all tests pass
4. Request review from maintainers

Thank you for contributing!
