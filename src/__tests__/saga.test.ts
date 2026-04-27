import { describe, it, expect } from 'vitest';
import { SagaOrchestrator, type SagaStep, type SagaContext } from '../messaging/saga.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface TestCtx extends SagaContext {
  log: string[];
}

function step(name: string, fail = false): SagaStep<TestCtx> {
  return {
    name,
    async execute(ctx) {
      ctx.log.push(`exec:${name}`);
      if (fail) throw new Error(`${name} failed`);
    },
    async compensate(ctx) {
      ctx.log.push(`comp:${name}`);
    },
  };
}

function failingCompensation(name: string): SagaStep<TestCtx> {
  return {
    name,
    async execute(ctx) {
      ctx.log.push(`exec:${name}`);
    },
    async compensate() {
      throw new Error(`${name} compensation failed`);
    },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SagaOrchestrator', () => {
  it('should execute all steps in order on success', async () => {
    const saga = new SagaOrchestrator<TestCtx>('test-success', [
      step('A'),
      step('B'),
      step('C'),
    ]);

    const result = await saga.run({ log: [] });

    expect(result.success).toBe(true);
    expect(result.context.log).toEqual(['exec:A', 'exec:B', 'exec:C']);
    expect(result.failedAt).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('should compensate executed steps in reverse on failure', async () => {
    const saga = new SagaOrchestrator<TestCtx>('test-fail-at-C', [
      step('A'),
      step('B'),
      step('C', true), // C will fail
    ]);

    const result = await saga.run({ log: [] });

    expect(result.success).toBe(false);
    expect(result.failedAt).toBe(2);
    expect(result.error?.message).toBe('C failed');
    // A and B executed, then compensated B → A (reverse)
    expect(result.context.log).toEqual([
      'exec:A',
      'exec:B',
      'exec:C',
      'comp:B',
      'comp:A',
    ]);
  });

  it('should compensate only executed steps when first step fails', async () => {
    const saga = new SagaOrchestrator<TestCtx>('test-fail-at-A', [
      step('A', true),
      step('B'),
      step('C'),
    ]);

    const result = await saga.run({ log: [] });

    expect(result.success).toBe(false);
    expect(result.failedAt).toBe(0);
    // A executed and failed, no steps to compensate
    expect(result.context.log).toEqual(['exec:A']);
  });

  it('should report compensation errors without stopping other compensations', async () => {
    const saga = new SagaOrchestrator<TestCtx>('test-comp-error', [
      step('A'),
      failingCompensation('B'), // B compensation will fail
      step('C', true),          // C execution will fail
    ]);

    const result = await saga.run({ log: [] });

    expect(result.success).toBe(false);
    expect(result.compensationErrors).toHaveLength(1);
    expect(result.compensationErrors![0].step).toBe('B');
    // A still compensated even though B compensation failed
    expect(result.context.log).toContain('comp:A');
  });

  it('should handle saga with zero steps', async () => {
    const saga = new SagaOrchestrator<TestCtx>('test-empty', []);

    const result = await saga.run({ log: [] });

    expect(result.success).toBe(true);
    expect(result.context.log).toEqual([]);
  });

  it('should handle single-step saga', async () => {
    const saga = new SagaOrchestrator<TestCtx>('test-single', [step('only')]);

    const result = await saga.run({ log: [] });

    expect(result.success).toBe(true);
    expect(result.context.log).toEqual(['exec:only']);
  });

  it('should not mutate the original context object', async () => {
    const original: TestCtx = { log: [] };
    const saga = new SagaOrchestrator<TestCtx>('test-immutable', [
      {
        name: 'mutator',
        async execute(ctx) {
          ctx.log.push('executed');
          ctx.extra = 'data';
        },
        async compensate() { /* noop */ },
      },
    ]);

    const result = await saga.run(original);

    // Shallow copy means the top-level context is different
    expect(result.context).not.toBe(original);
    expect(result.context.extra).toBe('data');
  });
});
