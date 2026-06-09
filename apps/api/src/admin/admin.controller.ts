import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../common/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/state-machine';

const CakeUpsert = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  basePrice: z.number().positive(),
  imageUrl: z.string().default(''),
  category: z.string().min(1),
  tag: z.string().nullable().optional(),
  gradient: z.string().nullable().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
const ToppingUpsert = z.object({ name: z.string().min(1), price: z.number().nonnegative(), isAvailable: z.boolean().default(true) });
const FlavorUpsert  = z.object({ name: z.string().min(1), priceModifier: z.number().nonnegative(), isAvailable: z.boolean().default(true) });
const ShapeUpsert   = z.object({ name: z.string().min(1), priceModifier: z.number().nonnegative(), modelAssetUrl: z.string().default('') });

const StatusUpdate = z.object({ status: z.enum(['pending','confirmed','baking','ready','out_for_delivery','delivered','cancelled','refunded']) });

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService, private orders: OrdersService) {}

  // ===== Cakes =====
  @Get('cakes')        listCakes()                        { return this.prisma.cake.findMany({ orderBy: { displayOrder: 'asc' } }); }
  @Post('cakes')       createCake(@Body() body: unknown)  { return this.prisma.cake.create({ data: CakeUpsert.parse(body) }); }
  @Patch('cakes/:id')  updateCake(@Param('id') id: string, @Body() body: unknown) {
    const data = CakeUpsert.partial().parse(body);
    return this.prisma.cake.update({ where: { id }, data });
  }
  @Delete('cakes/:id') deleteCake(@Param('id') id: string){ return this.prisma.cake.delete({ where: { id } }); }

  // ===== Toppings =====
  @Get('toppings')        listToppings()                       { return this.prisma.topping.findMany({ orderBy: { name: 'asc' } }); }
  @Post('toppings')       createTopping(@Body() body: unknown) { return this.prisma.topping.create({ data: ToppingUpsert.parse(body) }); }
  @Patch('toppings/:id')  updateTopping(@Param('id') id: string, @Body() body: unknown) {
    return this.prisma.topping.update({ where: { id }, data: ToppingUpsert.partial().parse(body) });
  }
  @Delete('toppings/:id') deleteTopping(@Param('id') id: string) { return this.prisma.topping.delete({ where: { id } }); }

  // ===== Flavors =====
  @Get('flavors')        listFlavors()                       { return this.prisma.flavor.findMany({ orderBy: { name: 'asc' } }); }
  @Post('flavors')       createFlavor(@Body() body: unknown) { return this.prisma.flavor.create({ data: FlavorUpsert.parse(body) }); }
  @Patch('flavors/:id')  updateFlavor(@Param('id') id: string, @Body() body: unknown) {
    return this.prisma.flavor.update({ where: { id }, data: FlavorUpsert.partial().parse(body) });
  }
  @Delete('flavors/:id') deleteFlavor(@Param('id') id: string) { return this.prisma.flavor.delete({ where: { id } }); }

  // ===== Shapes =====
  @Get('shapes')        listShapes()                       { return this.prisma.shape.findMany({ orderBy: { name: 'asc' } }); }
  @Post('shapes')       createShape(@Body() body: unknown) { return this.prisma.shape.create({ data: ShapeUpsert.parse(body) }); }
  @Patch('shapes/:id')  updateShape(@Param('id') id: string, @Body() body: unknown) {
    return this.prisma.shape.update({ where: { id }, data: ShapeUpsert.partial().parse(body) });
  }
  @Delete('shapes/:id') deleteShape(@Param('id') id: string) { return this.prisma.shape.delete({ where: { id } }); }

  // ===== Orders =====
  @Get('orders') listOrders() { return this.orders.listAll(); }
  @Patch('orders/:id/status')
  changeStatus(@Param('id') id: string, @Body() body: unknown) {
    const { status } = StatusUpdate.parse(body);
    return this.orders.updateStatus(id, status as OrderStatus, 'admin');
  }

  // ===== Users =====
  @Get('users')
  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===== Stats =====
  @Get('stats')
  async stats() {
    const [orders, cakes, customers, revenueAgg] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.cake.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'cancelled' } } }),
    ]);
    return { orders, cakes, customers, revenue: revenueAgg._sum.totalAmount ?? 0 };
  }
}
