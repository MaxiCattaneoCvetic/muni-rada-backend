import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum PedidoStage {
  APROBACION = 1,          // Secretaría aprueba
  PRESUPUESTOS = 2,        // Compras busca presupuestos
  FIRMA = 3,               // Secretaría firma
  GESTION_PAGOS = 4,       // Tesorería gestiona sellado/pago
  ESPERANDO_SUMINISTROS = 5, // Admin confirma recepción
  SUMINISTROS_LISTOS = 6,  // Completado
  RECHAZADO = 7,
}

export enum AreaMunicipal {
  ADMINISTRACION = 'Administración',
  OBRAS_PUBLICAS = 'Obras Públicas',
  SISTEMAS = 'Sistemas',
  RRHH = 'RRHH',
  CATASTRO = 'Catastro',
  INTENDENCIA = 'Intendencia',
  TURISMO = 'Turismo',
  TESORERIA_AREA = 'Tesorería',
  SECRETARIA_AREA = 'Secretaría',
}

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: string; // P-001, P-002, etc. — generado automáticamente

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ nullable: true })
  cantidad: string;

  @Column({ nullable: true, type: 'text' })
  detalle: string;

  @Column({ type: 'enum', enum: AreaMunicipal })
  area: AreaMunicipal;

  @Column({ default: false })
  urgente: boolean;

  @Column({ type: 'int', default: PedidoStage.APROBACION })
  stage: PedidoStage;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  monto: number;

  @Column({ nullable: true, name: 'proveedor_seleccionado' })
  proveedorSeleccionado: string;

  @Column({ default: false })
  bloqueado: boolean; // bloqueado por falta de sellado

  // Notas de cada etapa
  @Column({ nullable: true, type: 'text', name: 'nota_aprobacion' })
  notaAprobacion: string;

  @Column({ nullable: true, type: 'text', name: 'nota_rechazo' })
  notaRechazo: string;

  // Quién creó el pedido
  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'creado_por_id' })
  creadoPor: User;

  // Quién aprobó/rechazó
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'aprobado_por_id' })
  aprobadoPor: User;

  // Quién firmó el presupuesto
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'firmado_por_id' })
  firmadoPor: User;

  // URL de la imagen de firma usada (del perfil del secretario)
  @Column({ nullable: true, name: 'firma_url_usada' })
  firmaUrlUsada: string;

  @Column({ nullable: true, name: 'firma_hash' })
  firmaHash: string;

  @Column({ nullable: true, name: 'firmado_en', type: 'timestamp' })
  firmadoEn: Date;

  // Quién confirmó recepción (Admin)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recepcion_confirmada_por_id' })
  recepcionConfirmadaPor: User;

  @Column({ nullable: true, name: 'recepcion_en', type: 'timestamp' })
  recepcionEn: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
