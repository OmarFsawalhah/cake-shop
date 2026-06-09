import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CakesModule } from './cakes/cakes.module';
import { CustomCakesModule } from './custom-cakes/custom-cakes.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { CatalogModule } from './catalog/catalog.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CakesModule,
    CatalogModule,
    CustomCakesModule,
    OrdersModule,
    CartModule,
    AdminModule,
    UploadsModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
