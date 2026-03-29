import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Proveedor } from './proveedor.entity';
import { User } from '../users/user.entity';

@Entity('proveedor_comentarios')
export class ProveedorComentario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Proveedor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @Column({ name: 'proveedor_id' })
  proveedorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @Column({ type: 'text' })
  texto: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
