import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { AreaMunicipal } from '../common/enums/area-municipal.enum';

export { AreaMunicipal } from '../common/enums/area-municipal.enum';

export enum PedidoStage {
  APROBACION = 1,          // Secretaría aprueba
  PRESUPUESTOS = 2,        // Compras busca presupuestos
  FIRMA = 3,               // Secretaría firma
  CARGA_FACTURA = 4,       // Compras sube factura del proveedor
  GESTION_PAGOS = 5,       // Tesorería gestiona sellado/pago
  ESPERANDO_SUMINISTROS = 6, // Admin confirma recepción
  SUMINISTROS_LISTOS = 7,  // Completado
  RECHAZADO = 8,
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

  /** Fotos de referencia adjuntas por el solicitante al crear el pedido. */
  @Column({ type: 'jsonb', nullable: true, name: 'referencias_imagenes' })
  referenciasImagenes: { url: string; path: string }[] | null;

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

  /** Si stage es RECHAZADO: etapa desde la que se rechazó (p. ej. firma → UI "Presupuestos rechazados"). */
  @Column({ type: 'int', nullable: true, name: 'rechazado_desde_stage' })
  rechazadoDesdeStage: PedidoStage | null;

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

  // Factura del proveedor (Compras, antes de Tesorería)
  @Column({ nullable: true, name: 'factura_compras_url', type: 'text' })
  facturaComprasUrl: string;

  @Column({ nullable: true, name: 'factura_compras_path' })
  facturaComprasPath: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'factura_subida_por_id' })
  facturaSubidaPor: User;

  @Column({ nullable: true, name: 'factura_subida_en', type: 'timestamp' })
  facturaSubidaEn: Date;

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
