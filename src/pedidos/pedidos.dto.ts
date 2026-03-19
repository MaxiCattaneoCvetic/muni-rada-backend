import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
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
  // La firma se toma del perfil del usuario (firmaUrl)
  // Solo se requiere confirmación
  @ApiPropertyOptional()
  @IsString() @IsOptional()
  nota?: string;
}

export class ConfirmarRecepcionDto {
  @ApiPropertyOptional()
  @IsString() @IsOptional()
  nota?: string;
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
}
