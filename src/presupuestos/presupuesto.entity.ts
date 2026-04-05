// presupuesto.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Pedido } from '../pedidos/pedido.entity';
import { User } from '../users/user.entity';

@Entity('presupuestos')
export class Presupuesto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ name: 'pedido_id' })
  pedidoId: string;

  @Column()
  proveedor: string;

  @Column({ nullable: true })
  cuit: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ nullable: true, name: 'plazo_entrega' })
  plazoEntrega: string;

  @Column({ nullable: true })
  contacto: string;

  @Column({ nullable: true, type: 'text' })
  notas: string;

  @Column({ nullable: true, name: 'archivo_url' })
  archivoUrl: string;

  @Column({ nullable: true, name: 'archivo_path' })
  archivoPath: string;

  @Column({ nullable: true, name: 'archivo_firmado_url' })
  archivoFirmadoUrl: string;

  @Column({ nullable: true, name: 'archivo_firmado_path' })
  archivoFirmadoPath: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cargado_por_id' })
  cargadoPor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
