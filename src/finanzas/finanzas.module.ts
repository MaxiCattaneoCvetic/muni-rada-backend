import {
  Controller,
  Get,
  Injectable,
  Module,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Pedido } from '../pedidos/pedido.entity';
import { Pago } from '../pagos/pagos.module';
import { UserRole } from '../users/user.entity';

export class FinanzasFilterDto {
  @ApiPropertyOptional({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ example: 'Sistemas' })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional({ example: 'ACME' })
  @IsString()
  @IsOptional()
  proveedor?: string;
}

export interface GastoFinanzasItem {
  id: string;
  pedidoId: string;
  pedidoNumero: string;
  descripcion: string;
  area: string;
  proveedor: string;
  fechaPago: string;
  mes: string;
  montoPagado: number;
  numeroTransferencia: string;
  facturaUrl: string | null;
}

export interface FinanzasResumen {
  year: number;
  filters: {
    area: string | null;
    proveedor: string | null;
  };
  totalGastado: number;
  cantidadPagos: number;
  areaMayorGasto: { area: string; total: number } | null;
  proveedorMayorGasto: { proveedor: string; total: number } | null;
  porMes: Array<{ mes: string; total: number }>;
  porArea: Array<{ area: string; mes: string; total: number }>;
  porProveedor: Array<{ proveedor: string; mes: string; total: number }>;
}

type RawGastoFinanzasItem = {
  id: string;
  pedidoId: string;
  pedidoNumero: string;
  descripcion: string;
  area: string;
  proveedor: string | null;
  fechaPago: string;
  mes: string;
  montoPagado: string;
  numeroTransferencia: string;
  facturaUrl: string | null;
};

@Injectable()
export class FinanzasService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagosRepo: Repository<Pago>,
  ) {}

  async getGastos(filter: FinanzasFilterDto = {}): Promise<GastoFinanzasItem[]> {
    const year = this.resolveYear(filter.year);
    const rows = await this.buildBaseQuery({ ...filter, year })
      .select('pago.id', 'id')
      .addSelect('pago.pedidoId', 'pedidoId')
      .addSelect('pedido.numero', 'pedidoNumero')
      .addSelect('pedido.descripcion', 'descripcion')
      .addSelect('pedido.area', 'area')
      .addSelect(
        "COALESCE(NULLIF(TRIM(pedido.proveedorSeleccionado), ''), 'Sin proveedor')",
        'proveedor',
      )
      .addSelect('pago.fechaPago', 'fechaPago')
      .addSelect("TO_CHAR(pago.fechaPago, 'YYYY-MM')", 'mes')
      .addSelect('pago.montoPagado', 'montoPagado')
      .addSelect('pago.numeroTransferencia', 'numeroTransferencia')
      .addSelect('pago.facturaUrl', 'facturaUrl')
      .orderBy('pago.fechaPago', 'DESC')
      .addOrderBy('pedido.numero', 'ASC')
      .getRawMany<RawGastoFinanzasItem>();

    return rows.map((row) => ({
      id: row.id,
      pedidoId: row.pedidoId,
      pedidoNumero: row.pedidoNumero,
      descripcion: row.descripcion,
      area: row.area,
      proveedor: row.proveedor?.trim() || 'Sin proveedor',
      fechaPago: row.fechaPago,
      mes: row.mes,
      montoPagado: Number(row.montoPagado ?? 0),
      numeroTransferencia: row.numeroTransferencia,
      facturaUrl: row.facturaUrl,
    }));
  }

  async getResumen(filter: FinanzasFilterDto = {}): Promise<FinanzasResumen> {
    const year = this.resolveYear(filter.year);
    const gastos = await this.getGastos({ ...filter, year });

    const porMes = this.aggregateByMonth(gastos);
    const porArea = this.aggregateByAreaAndMonth(gastos);
    const porProveedor = this.aggregateByProveedorAndMonth(gastos);
    const areaMayorGasto = this.pickTopArea(gastos);
    const proveedorMayorGasto = this.pickTopProveedor(gastos);
    const totalGastado = gastos.reduce((acc, item) => acc + item.montoPagado, 0);

    return {
      year,
      filters: {
        area: filter.area?.trim() || null,
        proveedor: filter.proveedor?.trim() || null,
      },
      totalGastado,
      cantidadPagos: gastos.length,
      areaMayorGasto,
      proveedorMayorGasto,
      porMes,
      porArea,
      porProveedor,
    };
  }

  private buildBaseQuery(filter: FinanzasFilterDto & { year: number }) {
    const qb = this.pagosRepo
      .createQueryBuilder('pago')
      .innerJoin(Pedido, 'pedido', 'pedido.id = pago.pedidoId')
      .where('EXTRACT(YEAR FROM pago.fechaPago) = :year', { year: filter.year });

    const area = filter.area?.trim();
    if (area) {
      qb.andWhere('pedido.area = :area', { area });
    }

    const proveedor = filter.proveedor?.trim();
    if (proveedor) {
      qb.andWhere(
        "COALESCE(NULLIF(TRIM(pedido.proveedorSeleccionado), ''), 'Sin proveedor') = :proveedor",
        { proveedor },
      );
    }

    return qb;
  }

  private resolveYear(year?: number): number {
    return year ?? new Date().getFullYear();
  }

  private aggregateByMonth(gastos: GastoFinanzasItem[]) {
    const totals = new Map<string, number>();
    for (const gasto of gastos) {
      totals.set(gasto.mes, (totals.get(gasto.mes) ?? 0) + gasto.montoPagado);
    }
    return [...totals.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([mes, total]) => ({ mes, total }));
  }

  private aggregateByAreaAndMonth(gastos: GastoFinanzasItem[]) {
    const totals = new Map<string, { area: string; mes: string; total: number }>();
    for (const gasto of gastos) {
      const key = `${gasto.area}::${gasto.mes}`;
      const current = totals.get(key);
      if (current) {
        current.total += gasto.montoPagado;
        continue;
      }
      totals.set(key, { area: gasto.area, mes: gasto.mes, total: gasto.montoPagado });
    }
    return [...totals.values()].sort(
      (left, right) => left.mes.localeCompare(right.mes) || left.area.localeCompare(right.area),
    );
  }

  private aggregateByProveedorAndMonth(gastos: GastoFinanzasItem[]) {
    const totals = new Map<string, { proveedor: string; mes: string; total: number }>();
    for (const gasto of gastos) {
      const key = `${gasto.proveedor}::${gasto.mes}`;
      const current = totals.get(key);
      if (current) {
        current.total += gasto.montoPagado;
        continue;
      }
      totals.set(key, {
        proveedor: gasto.proveedor,
        mes: gasto.mes,
        total: gasto.montoPagado,
      });
    }
    return [...totals.values()].sort(
      (left, right) =>
        left.mes.localeCompare(right.mes) || left.proveedor.localeCompare(right.proveedor),
    );
  }

  private pickTopArea(gastos: GastoFinanzasItem[]) {
    const totals = new Map<string, number>();
    for (const gasto of gastos) {
      totals.set(gasto.area, (totals.get(gasto.area) ?? 0) + gasto.montoPagado);
    }
    const top = [...totals.entries()].sort(
      ([leftName, leftTotal], [rightName, rightTotal]) =>
        rightTotal - leftTotal || leftName.localeCompare(rightName),
    )[0];
    if (!top) return null;
    return { area: top[0], total: top[1] };
  }

  private pickTopProveedor(gastos: GastoFinanzasItem[]) {
    const totals = new Map<string, number>();
    for (const gasto of gastos) {
      totals.set(gasto.proveedor, (totals.get(gasto.proveedor) ?? 0) + gasto.montoPagado);
    }
    const top = [...totals.entries()].sort(
      ([leftName, leftTotal], [rightName, rightTotal]) =>
        rightTotal - leftTotal || leftName.localeCompare(rightName),
    )[0];
    if (!top) return null;
    return { proveedor: top[0], total: top[1] };
  }
}

@ApiTags('Finanzas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TESORERIA, UserRole.ADMIN)
@Controller('finanzas')
export class FinanzasController {
  constructor(private readonly finanzasService: FinanzasService) {}

  @Get('gastos')
  @ApiOperation({ summary: 'Listar gastos generados por pagos de Tesorería' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'area', required: false, type: String })
  @ApiQuery({ name: 'proveedor', required: false, type: String })
  getGastos(@Query() filter: FinanzasFilterDto) {
    return this.finanzasService.getGastos(filter);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen de gastos por mes, área y proveedor' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'area', required: false, type: String })
  @ApiQuery({ name: 'proveedor', required: false, type: String })
  getResumen(@Query() filter: FinanzasFilterDto) {
    return this.finanzasService.getResumen(filter);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Pago])],
  providers: [FinanzasService],
  controllers: [FinanzasController],
  exports: [FinanzasService],
})
export class FinanzasModule {}
