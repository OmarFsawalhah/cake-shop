import { BadRequestException, Body, Controller, Headers, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import Stripe from 'stripe';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../common/prisma.service';

const stripeKey = process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder';
const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

const CheckoutSchema = z.object({ orderId: z.string().min(1), successUrl: z.string().url().optional(), cancelUrl: z.string().url().optional() });

@Controller('payments')
export class PaymentsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  async createSession(@Req() req: any, @Body() body: unknown) {
    const { orderId, successUrl, cancelUrl } = CheckoutSchema.parse(body);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { cake: true, customCake: true } } },
    });
    if (!order) throw new BadRequestException('Order not found');
    if (order.userId !== req.user.userId) throw new BadRequestException('Forbidden');

    // If Stripe key is a placeholder, return a mock URL so the dev flow still works
    if (stripeKey.includes('placeholder')) {
      await this.prisma.payment.upsert({
        where: { orderId },
        update: { status: 'paid', paidAt: new Date(), transactionId: `mock_${Date.now()}` },
        create: { orderId, provider: 'mock', transactionId: `mock_${Date.now()}`, amount: order.totalAmount, status: 'paid', paidAt: new Date() },
      });
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'confirmed', paymentStatus: 'paid' } });
      return { mock: true, url: successUrl ?? '/?paid=mock' };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: order.items.map((i) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: i.cake?.name ?? `Custom cake (${i.customCakeId})` },
          unit_amount: Math.round(i.unitPrice * 100),
        },
        quantity: i.quantity,
      })),
      success_url: successUrl ?? 'http://localhost:8765/?paid=true&order=' + orderId,
      cancel_url: cancelUrl ?? 'http://localhost:8765/?paid=false',
      metadata: { orderId },
    });
    await this.prisma.payment.upsert({
      where: { orderId },
      update: { status: 'pending', transactionId: session.id, amount: order.totalAmount, provider: 'stripe' },
      create: { orderId, provider: 'stripe', transactionId: session.id, amount: order.totalAmount, status: 'pending' },
    });
    return { url: session.url };
  }

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<any>, @Headers('stripe-signature') sig: string) {
    if (!webhookSecret) return { received: true, note: 'webhook secret not configured' };
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody ?? '', sig, webhookSecret);
    } catch (e: any) {
      throw new BadRequestException(`Webhook signature failed: ${e.message}`);
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await this.prisma.payment.update({
          where: { orderId },
          data: { status: 'paid', paidAt: new Date() },
        });
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'confirmed', paymentStatus: 'paid' },
        });
      }
    }
    return { received: true };
  }
}
