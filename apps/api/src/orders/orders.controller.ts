import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';

const CreateOrderSchema = z.object({
  deliveryDate: z.string().optional(),
  paymentMethod: z.enum(['cash', 'online']).optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
  }).optional(),
});

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  create(@Req() req: any, @Body() body: unknown) {
    const data = CreateOrderSchema.parse(body);
    return this.orders.createFromCart(req.user.userId, {
      deliveryDate: data.deliveryDate ?? new Date(Date.now() + 3 * 86400_000).toISOString(),
      paymentMethod: data.paymentMethod,
      address: data.address,
    });
  }

  @Get()
  list(@Req() req: any) {
    return this.orders.listForUser(req.user.userId);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.orders.getForUser(req.user.userId, id);
  }
}
