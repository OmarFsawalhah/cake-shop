import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CartService } from './cart.service';

const AddItemSchema = z.object({
  cakeId: z.string().optional(),
  customCakeId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});

const UpdateQtySchema = z.object({
  quantity: z.number().int().min(0),
});

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post('items')
  addItem(@Req() req: any, @Body() body: unknown) {
    const data = AddItemSchema.parse(body);
    return this.cartService.addItem(req.user.userId, data);
  }

  @Patch('items/:id')
  updateQty(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const { quantity } = UpdateQtySchema.parse(body);
    return this.cartService.updateItemQty(req.user.userId, id, quantity);
  }

  @Delete('items/:id')
  removeItem(@Req() req: any, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.userId, id);
  }

  @Delete()
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user.userId);
  }
}
