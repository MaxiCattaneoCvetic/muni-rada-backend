import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from './user.entity';
import { AreaMunicipal } from '../common/enums/area-municipal.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'maria.gonzalez@radatilly.gob.ar' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'María' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'González' })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SECRETARIA })
  @IsEnum(UserRole)
  rol: UserRole;

  // Admin sets initial password (user must change on first login)
  @ApiProperty({ example: 'TempPass123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: AreaMunicipal })
  @IsOptional()
  @IsEnum(AreaMunicipal)
  areaAsignada?: AreaMunicipal | null;

  @ApiPropertyOptional({ type: [String], enum: AreaMunicipal, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(AreaMunicipal, { each: true })
  areasPedidoPermitidas?: AreaMunicipal[] | null;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  apellido?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  rol?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: AreaMunicipal, nullable: true })
  @IsOptional()
  @IsEnum(AreaMunicipal)
  areaAsignada?: AreaMunicipal | null;

  @ApiPropertyOptional({ type: [String], enum: AreaMunicipal, isArray: true, nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(AreaMunicipal, { each: true })
  areasPedidoPermitidas?: AreaMunicipal[] | null;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'NewTempPass123!' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
