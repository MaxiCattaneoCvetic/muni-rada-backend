import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity';
import { PedidoComentario } from './pedido-comentario.entity';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { PresupuestosModule } from '../presupuestos/presupuestos.module';
import { ConfigSystemModule } from '../config/config.module';
import { ArchivosModule } from '../archivos/archivos.module';
import { UsersModule } from '../users/users.module';
import { OrdenCompraModule } from '../orden-compra/orden-compra.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, PedidoComentario]),
    forwardRef(() => PresupuestosModule),
    ConfigSystemModule,
    ArchivosModule,
    UsersModule,
    OrdenCompraModule,
  ],
  providers: [PedidosService],
  controllers: [PedidosController],
  exports: [PedidosService],
})
export class PedidosModule {}
