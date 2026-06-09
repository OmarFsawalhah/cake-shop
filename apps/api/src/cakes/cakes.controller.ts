import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Controller('cakes')
export class CakesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.cake.findMany({ where: { isActive: true } });
  }
}
