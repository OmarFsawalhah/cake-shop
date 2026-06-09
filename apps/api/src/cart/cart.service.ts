import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

interface AddItemInput {
  cakeId?: string;
  customCakeId?: string;
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // ── internal helpers ─────────────────────────────────────────────────────

  async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  // ── public API ────────────────────────────────────────────────────────────

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { cake: true, customCake: true },
          orderBy: { id: 'asc' },
        },
      },
    });
    // Return a consistent shape even when no cart exists yet
    return cart ?? { userId, items: [] };
  }

  async addItem(userId: string, input: AddItemInput) {
    // BR-11: exactly one of cakeId / customCakeId
    const hasCake = Boolean(input.cakeId);
    const hasCustom = Boolean(input.customCakeId);
    if (hasCake === hasCustom) {
      throw new BadRequestException(
        'Provide exactly one of cakeId or customCakeId (BR-11)',
      );
    }
    if (input.quantity < 1) {
      throw new BadRequestException('quantity must be at least 1');
    }

    const cart = await this.getOrCreateCart(userId);

    // Fetch unit price and verify the item exists
    let unitPrice: number;
    if (input.cakeId) {
      const cake = await this.prisma.cake.findUnique({
        where: { id: input.cakeId },
      });
      if (!cake || !cake.isActive) throw new NotFoundException('Cake not found');
      unitPrice = cake.basePrice;
    } else {
      const cc = await this.prisma.customCake.findUnique({
        where: { id: input.customCakeId! },
      });
      if (!cc) throw new NotFoundException('CustomCake not found');
      unitPrice = cc.computedPrice;
    }

    // Manual upsert — no DB unique index on (cartId, cakeId/customCakeId)
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        ...(input.cakeId
          ? { cakeId: input.cakeId }
          : { customCakeId: input.customCakeId }),
      },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + input.quantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        cakeId: input.cakeId ?? null,
        customCakeId: input.customCakeId ?? null,
        quantity: input.quantity,
        unitPrice,
      },
    });
  }

  async updateItemQty(userId: string, cartItemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (item.cart.userId !== userId) throw new ForbiddenException();

    // quantity 0 means "remove"
    if (quantity === 0) {
      return this.prisma.cartItem.delete({ where: { id: cartItemId } });
    }
    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  async removeItem(userId: string, cartItemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (item.cart.userId !== userId) throw new ForbiddenException();
    return this.prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}
