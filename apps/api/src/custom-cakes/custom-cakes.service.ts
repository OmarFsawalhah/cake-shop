import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { calculateCustomCakePrice } from './pricing';

export interface CreateCustomCakeDto {
  shape: string;
  size: string;
  layers: { flavor: string }[];
  frosting: string;
  colorHex: string;
  toppings: string[];
  messageText?: string;
  messageFont?: string;
  photoUrl?: string;
}

@Injectable()
export class CustomCakesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCustomCakeDto) {
    // BR-01: 1–5 layers
    if (dto.layers.length < 1 || dto.layers.length > 5) {
      throw new BadRequestException('BR-01: layer count must be between 1 and 5');
    }

    // Resolve shape
    const shape = await this.prisma.shape.findUnique({ where: { name: dto.shape } });
    if (!shape) throw new NotFoundException(`Shape "${dto.shape}" not found`);

    // Resolve flavors
    const resolvedLayers: { flavor: { priceModifier: number }; flavorId: string }[] = [];
    for (const layer of dto.layers) {
      const flavor = await this.prisma.flavor.findUnique({ where: { name: layer.flavor } });
      if (!flavor) throw new NotFoundException(`Flavor "${layer.flavor}" not found`);
      resolvedLayers.push({ flavor: { priceModifier: flavor.priceModifier }, flavorId: flavor.id });
    }

    // Resolve toppings
    const resolvedToppings: { price: number; toppingId: string }[] = [];
    for (const name of dto.toppings) {
      const topping = await this.prisma.topping.findUnique({ where: { name } });
      if (!topping) throw new NotFoundException(`Topping "${name}" not found`);
      resolvedToppings.push({ price: topping.price, toppingId: topping.id });
    }

    // Compute price server-side (BR-04)
    const computedPrice = calculateCustomCakePrice({
      shape: { priceModifier: shape.priceModifier },
      size: dto.size as 'small' | 'medium' | 'large',
      layers: resolvedLayers.map((l) => ({ flavor: l.flavor })),
      toppings: resolvedToppings.map((t) => ({ price: t.price })),
    });

    // Persist
    const customCake = await this.prisma.customCake.create({
      data: {
        userId,
        shapeId: shape.id,
        size: dto.size,
        layerCount: dto.layers.length,
        frosting: dto.frosting,
        colorHex: dto.colorHex,
        messageText: dto.messageText ?? null,
        messageFont: dto.messageFont ?? null,
        photoUrl: dto.photoUrl ?? null,
        computedPrice,
        layers: {
          create: resolvedLayers.map((l, idx) => ({
            layerOrder: idx,
            flavorId: l.flavorId,
          })),
        },
        toppings: {
          create: resolvedToppings.map((t) => ({ toppingId: t.toppingId })),
        },
      },
    });

    return { id: customCake.id, computedPrice };
  }
}
