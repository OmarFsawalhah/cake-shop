import { Module } from '@nestjs/common';
import { CustomCakesService } from './custom-cakes.service';
import { CustomCakesController } from './custom-cakes.controller';

@Module({
  providers: [CustomCakesService],
  controllers: [CustomCakesController],
})
export class CustomCakesModule {}
