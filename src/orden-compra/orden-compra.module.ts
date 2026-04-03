import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenCompraService } from './orden-compra.service';
import { Pedido } from '../pedidos/pedido.entity';
import { Proveedor } from '../proveedores/proveedor.entity';
import { ArchivosModule } from '../archivos/archivos.module';
import { ConfigSystemModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Proveedor]),
    ArchivosModule,
    ConfigSystemModule,
  ],
  providers: [OrdenCompraService],
  exports: [OrdenCompraService],
})
export class OrdenCompraModule {}
