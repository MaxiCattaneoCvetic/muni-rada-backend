import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength, Matches, ValidateIf,
} from 'class-validator';

/** CUIT argentino: 11 dígitos, guiones opcionales. */
const CUIT_REGEX = /^\d{2}-?\d{8}-?\d{1}$/;

export class CreateProveedorDto {
  @ApiProperty({ example: 'Distribuidora Sur S.A.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiPropertyOptional({ example: 'Distri Sur' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombreFantasia?: string;

  @ApiPropertyOptional({ example: '30-12345678-9' })
  @IsOptional()
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsString()
  @Matches(CUIT_REGEX, { message: 'CUIT inválido (11 dígitos, formato XX-XXXXXXXX-X)' })
  cuit?: string;

  @ApiPropertyOptional({ example: 'Responsable inscripto' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  condicionIva?: string;

  @ApiPropertyOptional({ example: 'Av. San Martín 1234, PB' })
  @IsString()
  @IsOptional()
  domicilioCalle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(128)
  localidad?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(64)
  provincia?: string;

  @ApiPropertyOptional({ example: '9400' })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  codigoPostal?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(32)
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v != null && String(v).trim() !== '')
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'Área compras — Juan Pérez' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  contacto?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notas?: string;
}

/** Actualización parcial (todos los campos opcionales). */
export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {}

export class CreateProveedorComentarioDto {
  @ApiProperty({ example: 'Acordamos plazo de 10 días para la próxima entrega.' })
  @IsString()
  @IsNotEmpty()
  texto: string;
}
