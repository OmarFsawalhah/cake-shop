import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { canTransition, OrderStatus } from './state-machine';

export interface CreateOrderDto {
  deliveryDate: string;
  paymentMethod?: 'cash' | 'online';
  address?: { street: string; city: string; postalCode: string };
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createFromCart(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Resolve or create address (auto-create a default if none provided)
    let addressId: string;
    if (dto.address) {
      const created = await this.prisma.address.create({
        data: { userId, ...dto.address, isDefault: false },
      });
      addressId = created.id;
    } else {
      const existing = await this.prisma.address.findFirst({ where: { userId, isDefault: true } });
      if (existing) addressId = existing.id;
      else {
        const created = await this.prisma.address.create({
          data: { userId, street: 'لم يُحدد', city: 'لم يُحدد', postalCode: '00000', isDefault: true },
        });
        addressId = created.id;
      }
    }

    const totalAmount = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const paymentMethod = dto.paymentMethod ?? 'online';

    const order = await this.prisma.order.create({
      data: {
        userId,
        addressId,
        totalAmount,
        paymentMethod,
        deliveryDate: new Date(dto.deliveryDate || Date.now() + 3 * 86400_000),
        items: {
          create: cart.items.map((i) => ({
            cakeId: i.cakeId,
            customCakeId: i.customCakeId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    // Clear cart after order placed
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  }

  listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { cake: true, customCake: true } }, payment: true },
    });
  }

  async getForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { cake: true, customCake: true } }, payment: true, address: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  listAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } }, items: true, payment: true },
    });
  }

  async updateStatus(orderId: string, next: OrderStatus, actor: 'admin' | 'customer' = 'admin') {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (!canTransition(order.status as OrderStatus, next, actor)) {
      throw new BadRequestException(`${actor} cannot transition ${order.status} -> ${next}`);
    }
    return this.prisma.order.update({ where: { id: orderId }, data: { status: next } });
  }
}
