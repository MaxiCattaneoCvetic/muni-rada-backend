import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';
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

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  nota?: string;
}

export class ConfirmarRecepcionDto {
  @ApiPropertyOptional()
  @IsString() @IsOptional()
  nota?: string;
}

/** Body vacío; el archivo va en multipart `factura`. */
export class SubirFacturaDto {}

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
}
