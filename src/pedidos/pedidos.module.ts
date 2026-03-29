import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { PresupuestosModule } from '../presupuestos/presupuestos.module';
import { ConfigSystemModule } from '../config/config.module';
import { ArchivosModule } from '../archivos/archivos.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido]),
    forwardRef(() => PresupuestosModule),
    ConfigSystemModule,
    ArchivosModule,
    UsersModule,
  ],
  providers: [PedidosService],
  controllers: [PedidosController],
  exports: [PedidosService],
})
export class PedidosModule {}
