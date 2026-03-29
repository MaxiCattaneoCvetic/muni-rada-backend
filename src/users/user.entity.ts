import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { AreaMunicipal } from '../common/enums/area-municipal.enum';

export enum UserRole {
  SECRETARIA = 'secretaria',
  COMPRAS = 'compras',
  TESORERIA = 'tesoreria',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ type: 'enum', enum: UserRole })
  rol: UserRole;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: true, name: 'must_change_password' })
  mustChangePassword: boolean;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  // URL de firma escaneada guardada en Supabase Storage
  @Column({ nullable: true, name: 'firma_url' })
  firmaUrl: string;

  @Column({ nullable: true, name: 'firma_path' })
  firmaPath: string;

  /** Área municipal del usuario (referencia organizacional). */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'area_asignada' })
  areaAsignada: AreaMunicipal | null;

  /**
   * Áreas para las que puede crear pedidos como solicitante.
   * null = sin restricción explícita (todas las áreas; compatibilidad).
   * [] = no puede crear pedidos.
   */
  @Column({ type: 'simple-json', nullable: true, name: 'areas_pedido_permitidas' })
  areasPedidoPermitidas: AreaMunicipal[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellido}`;
  }
}
