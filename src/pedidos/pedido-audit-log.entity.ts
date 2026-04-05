import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum PedidoAuditEvento {
  CREACION = 'CREACION',
  APROBACION = 'APROBACION',
  RECHAZO = 'RECHAZO',
  PRESUPUESTO_ENVIADO = 'PRESUPUESTO_ENVIADO',
  PRESUPUESTO_RECHAZADO = 'PRESUPUESTO_RECHAZADO',
  FIRMA = 'FIRMA',
  FACTURA_SUBIDA = 'FACTURA_SUBIDA',
  PAGO = 'PAGO',
  RECEPCION_CONFIRMADA = 'RECEPCION_CONFIRMADA',
  ARCHIVADO = 'ARCHIVADO',
}

@Entity('pedido_audit_log')
export class PedidoAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pedido_id' })
  pedidoId: string;

  @Column({ type: 'enum', enum: PedidoAuditEvento })
  evento: PedidoAuditEvento;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User | null;

  /** Área involucrada en el evento (área receptora, área del pedido, etc.). */
  @Column({ nullable: true })
  area: string;

  @Column({ nullable: true, type: 'text' })
  nota: string;

  @Column({ type: 'int', nullable: true, name: 'stage_anterior' })
  stageAnterior: number | null;

  @Column({ type: 'int', nullable: true, name: 'stage_nuevo' })
  stageNuevo: number | null;

  /** Datos adicionales libres (proveedor, monto, número de sellado, etc.). */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
