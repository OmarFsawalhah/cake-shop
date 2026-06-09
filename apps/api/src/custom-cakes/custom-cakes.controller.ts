import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomCakesService } from './custom-cakes.service';

const LayerSchema = z.object({
  flavor: z.string().min(1),
});

const CreateCustomCakeSchema = z.object({
  shape: z.enum(['round', 'square', 'heart']),
  size: z.enum(['small', 'medium', 'large']),
  layers: z.array(LayerSchema).min(1).max(5),
  frosting: z.enum(['smooth', 'whipped', 'fondant']),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'colorHex must be a 6-digit hex'),
  toppings: z.array(z.string()).default([]),
  messageText: z.string().max(60).optional(),
  messageFont: z.string().optional(),
  photoUrl: z.string().optional(),
});

@Controller('custom-cakes')
@UseGuards(JwtAuthGuard)
export class CustomCakesController {
  constructor(private readonly service: CustomCakesService) {}

  @Post()
  async create(@Body() body: unknown, @Req() req: any) {
    const parsed = CreateCustomCakeSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.service.create(req.user.userId, parsed.data);
  }
}
