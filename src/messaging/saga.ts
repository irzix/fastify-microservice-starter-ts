import { logger } from '../core/logger.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Context shared across all saga steps (mutable key-value bag) */
export type SagaContext = Record<string, unknown>;

/** A single step inside a saga */
export interface SagaStep<T extends SagaContext = SagaContext> {
  /** Unique name for logging / debugging */
  name: string;

  /** Forward action — must be idempotent when possible */
  execute(ctx: T): Promise<void>;

  /**
   * Compensation (rollback) action — called when a later step fails.
   * Receives the same context so it can undo side-effects.
   */
  compensate(ctx: T): Promise<void>;
}

/** Result returned after saga execution */
export interface SagaResult<T extends SagaContext = SagaContext> {
  success: boolean;
  context: T;
  /** Step index where execution stopped (only when success=false) */
  failedAt?: number;
  /** Original error from the failing step */
  error?: Error;
  /** Steps whose compensation also failed */
  compensationErrors?: Array<{ step: string; error: Error }>;
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/**
 * Lightweight Saga Orchestrator.
 *
 * Runs an ordered list of steps sequentially.
 * If any step throws, it compensates every *already-executed* step
 * in reverse order (newest → oldest).
 */
export class SagaOrchestrator<T extends SagaContext = SagaContext> {
  constructor(
    /** A readable saga name — used in logs */
    private readonly name: string,
    /** Ordered list of steps to execute */
    private readonly steps: SagaStep<T>[],
  ) {}

  async run(initialContext: T): Promise<SagaResult<T>> {
    const ctx = { ...initialContext };
    const executed: SagaStep<T>[] = [];

    logger.info({ saga: this.name }, `▶ Saga started`);

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      try {
        logger.debug({ saga: this.name, step: step.name }, `  → Executing step ${i + 1}/${this.steps.length}`);
        await step.execute(ctx);
        executed.push(step);
        logger.debug({ saga: this.name, step: step.name }, `  ✓ Step succeeded`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error({ saga: this.name, step: step.name, err: error }, `  ✗ Step failed`);

        // ── Compensate in reverse ─────────────────────────────────────
        const compensationErrors = await this.compensate(executed, ctx);

        return {
          success: false,
          context: ctx,
          failedAt: i,
          error,
          compensationErrors: compensationErrors.length ? compensationErrors : undefined,
        };
      }
    }

    logger.info({ saga: this.name }, `✓ Saga completed successfully`);
    return { success: true, context: ctx };
  }

  /** Compensate already-executed steps in reverse order */
  private async compensate(
    executed: SagaStep<T>[],
    ctx: T,
  ): Promise<Array<{ step: string; error: Error }>> {
    const errors: Array<{ step: string; error: Error }> = [];

    logger.info({ saga: this.name, count: executed.length }, `↩ Compensating…`);

    for (let i = executed.length - 1; i >= 0; i--) {
      const step = executed[i];
      try {
        logger.debug({ saga: this.name, step: step.name }, `  ↩ Compensating step`);
        await step.compensate(ctx);
        logger.debug({ saga: this.name, step: step.name }, `  ✓ Compensation succeeded`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error({ saga: this.name, step: step.name, err: error }, `  ✗ Compensation failed`);
        errors.push({ step: step.name, error });
      }
    }

    if (errors.length === 0) {
      logger.info({ saga: this.name }, `✓ All compensations succeeded`);
    } else {
      logger.error({ saga: this.name, count: errors.length }, `✗ Some compensations failed`);
    }

    return errors;
  }
}
