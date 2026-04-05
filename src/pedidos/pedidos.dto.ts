import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsUUID, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AreaMunicipal } from './pedido.entity';

export class CreatePedidoDto {
  @ApiProperty({ example: 'Resmas papel A4 x5' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ example: '5 resmas' })
  @IsString() @IsOptional()
  cantidad?: string;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  detalle?: string;

  @ApiProperty({ enum: AreaMunicipal })
  @IsEnum(AreaMunicipal)
  area: AreaMunicipal;

  @ApiPropertyOptional({ enum: AreaMunicipal, description: 'Área destino del suministro (si difiere del área solicitante)' })
  @IsEnum(AreaMunicipal) @IsOptional()
  areaDestino?: AreaMunicipal;

  @ApiPropertyOptional({ default: false })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === '1') return true;
    return false;
  })
  @IsBoolean() @IsOptional()
  urgente?: boolean;
}

export class AprobarPedidoDto {
  @ApiPropertyOptional({ example: 'Aprobado. Priorizar proveedores locales.' })
  @IsString() @IsOptional()
  nota?: string;
}

export class RechazarPedidoDto {
  @ApiProperty({ example: 'Monto excede presupuesto disponible.' })
  @IsString() @IsNotEmpty()
  motivo: string;
}

export class FirmarPresupuestoDto {
  @ApiProperty({ description: 'ID del presupuesto que Secretaría autoriza con su firma' })
  @IsUUID()
  presupuestoId: string;

  @ApiPropertyOptional({ enum: ['digital', 'escaneado'], description: 'Modo de firma del presupuesto' })
  @IsString() @IsOptional()
  modoFirma?: 'digital' | 'escaneado';

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  nota?: string;
}

export class ConfirmarRecepcionDto {
  @ApiPropertyOptional()
  @IsString() @IsOptional()
  nota?: string;
}

/** Metadatos de la factura; el archivo PDF va en multipart `factura`. */
export class SubirFacturaDto {
  @ApiPropertyOptional({ example: '2026-05-15', description: 'Fecha límite para realizar el pago (YYYY-MM-DD)' })
  @IsDateString() @IsOptional()
  fechaLimitePago?: string;
}

export class CreatePedidoComentarioDto {
  @ApiProperty({ example: 'El proveedor confirmó entrega para el viernes.' })
  @IsString()
  @IsNotEmpty()
  texto: string;
}

export class PedidoFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  stage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  urgente?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Incluir pedidos archivados en los resultados. Por defecto false.' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return undefined;
  })
  includeArchived?: boolean;
}
