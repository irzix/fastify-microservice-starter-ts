import autocannon from 'autocannon';

const url = process.env.BENCH_URL ?? 'http://localhost:3000';
const duration = Number.parseInt(process.env.BENCH_DURATION ?? '10', 10);
const connections = Number.parseInt(process.env.BENCH_CONNECTIONS ?? '100', 10);
const pipelining = Number.parseInt(process.env.BENCH_PIPELINING ?? '10', 10);

interface BenchTarget {
  title: string;
  method: 'GET' | 'POST';
  path: string;
  body?: string;
  headers?: Record<string, string>;
}

const targets: BenchTarget[] = [
  {
    title: 'GET /health',
    method: 'GET',
    path: '/health',
  },
  {
    title: 'POST /api/v1/order',
    method: 'POST',
    path: '/api/v1/order',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      orderId: 'bench_1',
      userId: 'u_1',
      items: [{ productId: 'p1', qty: 1 }],
      totalAmount: 100
    })
  },
];

function formatNumber(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

async function runBench(target: BenchTarget) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${target.title}`);
  console.log(`${'='.repeat(60)}`);

  const result = await autocannon({
    url: `${url}${target.path}`,
    method: target.method,
    duration,
    connections,
    pipelining,
    ...(target.body ? { body: target.body, headers: target.headers } : {}),
  });

  console.log(`  Requests/sec:  ${formatNumber(result.requests.average)}`);
  console.log(`  Latency avg:   ${formatNumber(result.latency.average)} ms`);
  console.log(`  Latency p99:   ${formatNumber(result.latency.p99)} ms`);
  console.log(`  Throughput:    ${formatNumber(result.throughput.average / 1024 / 1024)} MB/s`);
  console.log(`  Total reqs:    ${formatNumber(result.requests.total)}`);
  console.log(`  Errors:        ${result.errors}`);
  console.log(`  Timeouts:      ${result.timeouts}`);

  return result;
}

async function main() {
  console.log('Fastify Microservice Benchmark');
  console.log(`URL: ${url}`);
  console.log(`Duration: ${duration}s | Connections: ${connections} | Pipelining: ${pipelining}`);

  for (const target of targets) {
    await runBench(target);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('  Benchmark complete');
  console.log(`${'='.repeat(60)}\n`);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
