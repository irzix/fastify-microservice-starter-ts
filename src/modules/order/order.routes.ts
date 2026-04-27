import type { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { createOrderSaga } from '../order/order.saga.js';

const OrderItemSchema = Type.Object({
  productId: Type.String(),
  qty: Type.Integer({ minimum: 1 }),
});

const CreateOrderSchema = Type.Object({
  orderId: Type.String(),
  userId: Type.String(),
  items: Type.Array(OrderItemSchema, { minItems: 1 }),
  totalAmount: Type.Number({ minimum: 0 }),
});

export async function orderRoutes(server: FastifyInstance): Promise<void> {
  server.post(
    '/order',
    {
      schema: {
        body: CreateOrderSchema,
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            context: Type.Unknown(),
          }),
          500: Type.Object({
            success: Type.Boolean(),
            error: Type.Optional(Type.String()),
            failedAt: Type.Optional(Type.Integer()),
            context: Type.Unknown(),
          }),
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        orderId: string;
        userId: string;
        items: Array<{ productId: string; qty: number }>;
        totalAmount: number;
      };

      const result = await createOrderSaga.run({
        orderId: body.orderId,
        userId: body.userId,
        items: body.items,
        totalAmount: body.totalAmount,
      });

      if (!result.success) {
        return reply.code(500).send({
          success: false,
          error: result.error?.message,
          failedAt: result.failedAt,
          context: result.context,
        });
      }

      return { success: true, context: result.context };
    },
  );
}
