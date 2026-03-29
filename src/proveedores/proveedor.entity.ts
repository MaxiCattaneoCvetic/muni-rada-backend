import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('proveedores')
export class Proveedor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Razón social o denominación legal (se usa para vincular pedidos y cotizaciones). */
  @Column()
  nombre: string;

  @Column({ nullable: true, name: 'nombre_fantasia' })
  nombreFantasia: string;

  @Column({ nullable: true })
  cuit: string;

  /** Condición frente al IVA (texto libre acotado en el front). */
  @Column({ nullable: true, name: 'condicion_iva', length: 64 })
  condicionIva: string;

  @Column({ nullable: true, type: 'text', name: 'domicilio_calle' })
  domicilioCalle: string;

  @Column({ nullable: true, length: 128 })
  localidad: string;

  @Column({ nullable: true, length: 64 })
  provincia: string;

  @Column({ nullable: true, name: 'codigo_postal', length: 16 })
  codigoPostal: string;

  @Column({ nullable: true, length: 32 })
  telefono: string;

  @Column({ nullable: true, length: 255 })
  email: string;

  /** Persona o área de contacto comercial. */
  @Column({ nullable: true })
  contacto: string;

  @Column({ nullable: true, type: 'text' })
  notas: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
