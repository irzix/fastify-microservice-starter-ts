import type { SagaStep } from '../../messaging/saga.js';
import { SagaOrchestrator } from '../../messaging/saga.js';
import { natsClient } from '../../messaging/nats.js';
import { logger } from '../../core/logger.js';

export interface OrderSagaContext extends Record<string, unknown> {
  orderId: string;
  userId: string;
  items: Array<{ productId: string; qty: number }>;
  totalAmount: number;
  inventoryReserved?: boolean;
  paymentId?: string;
  orderConfirmed?: boolean;
}

const reserveInventory: SagaStep<OrderSagaContext> = {
  name: 'reserve-inventory',
  async execute(ctx) {
    logger.info({ orderId: ctx.orderId, items: ctx.items }, 'Reserving inventory…');
    natsClient.publish('inventory.reserve', { orderId: ctx.orderId, items: ctx.items });
    ctx.inventoryReserved = true;
  },
  async compensate(ctx) {
    logger.info({ orderId: ctx.orderId }, 'Releasing inventory reservation…');
    natsClient.publish('inventory.release', { orderId: ctx.orderId, items: ctx.items });
    ctx.inventoryReserved = false;
  },
};

const chargePayment: SagaStep<OrderSagaContext> = {
  name: 'charge-payment',
  async execute(ctx) {
    logger.info({ orderId: ctx.orderId, amount: ctx.totalAmount }, 'Charging payment…');
    natsClient.publish('payment.charge', { orderId: ctx.orderId, userId: ctx.userId, amount: ctx.totalAmount });
    ctx.paymentId = `pay_${Date.now()}`;
  },
  async compensate(ctx) {
    logger.info({ orderId: ctx.orderId, paymentId: ctx.paymentId }, 'Refunding payment…');
    natsClient.publish('payment.refund', { orderId: ctx.orderId, paymentId: ctx.paymentId });
    ctx.paymentId = undefined;
  },
};

const confirmOrder: SagaStep<OrderSagaContext> = {
  name: 'confirm-order',
  async execute(ctx) {
    logger.info({ orderId: ctx.orderId }, 'Confirming order…');
    natsClient.publish('order.confirmed', { orderId: ctx.orderId, userId: ctx.userId, items: ctx.items, totalAmount: ctx.totalAmount });
    ctx.orderConfirmed = true;
  },
  async compensate(ctx) {
    logger.info({ orderId: ctx.orderId }, 'Cancelling order…');
    natsClient.publish('order.cancelled', { orderId: ctx.orderId });
    ctx.orderConfirmed = false;
  },
};

export const createOrderSaga = new SagaOrchestrator<OrderSagaContext>(
  'create-order',
  [reserveInventory, chargePayment, confirmOrder],
);
