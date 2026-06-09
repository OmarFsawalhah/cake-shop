import { Module } from '@nestjs/common';
import { CakesController } from './cakes.controller';

@Module({
  controllers: [CakesController],
})
export class CakesModule {}
