import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

/** Public reference data the frontend needs (shapes, flavors, toppings). */
@Controller('catalog')
export class CatalogController {
  constructor(private prisma: PrismaService) {}

  @Get('shapes')
  shapes() { return this.prisma.shape.findMany({ orderBy: { name: 'asc' } }); }

  @Get('flavors')
  flavors() { return this.prisma.flavor.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } }); }

  @Get('toppings')
  toppings() { return this.prisma.topping.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } }); }
}
