import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proveedor } from './proveedor.entity';
import { ProveedorComentario } from './proveedor-comentario.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { Pago } from '../pagos/pagos.module';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { ProveedoresService } from './proveedores.service';
import { ProveedoresController } from './proveedores.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proveedor,
      ProveedorComentario,
      Pedido,
      Pago,
      Presupuesto,
    ]),
  ],
  providers: [ProveedoresService],
  controllers: [ProveedoresController],
  exports: [ProveedoresService],
})
export class ProveedoresModule {}
