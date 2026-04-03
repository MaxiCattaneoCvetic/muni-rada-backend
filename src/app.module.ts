import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PresupuestosModule } from './presupuestos/presupuestos.module';
import { SelladosModule } from './sellados/sellados.module';
import { PagosModule } from './pagos/pagos.module';
import { ArchivosModule } from './archivos/archivos.module';
import { ConfigSystemModule, SistemaConfig } from './config/config.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { FinanzasModule } from './finanzas/finanzas.module';
import { ReportesModule, Reporte, ReporteMensaje } from './reportes/reportes.module';
import { User } from './users/user.entity';
import { Pedido } from './pedidos/pedido.entity';
import { Presupuesto } from './presupuestos/presupuesto.entity';
import { Proveedor } from './proveedores/proveedor.entity';
import { ProveedorComentario } from './proveedores/proveedor-comentario.entity';
import { Pago } from './pagos/pagos.module';
import { Sellado } from './sellados/sellados.module';

/** Entidades registradas en el DataSource global (el glob *.entity.ts no incluye clases definidas en *.module.ts). */
const TYPEORM_ENTITIES = [
  User, Pedido, Presupuesto, Proveedor, ProveedorComentario, Pago, Sellado, SistemaConfig, Reporte, ReporteMensaje,
];

@Module({
  imports: [
    // Config global
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = config.get<string>('DATABASE_URL')?.trim();
        const ssl =
          config.get<string>('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: false as const }
            : false;
        const synchronize = config.get<string>('NODE_ENV') !== 'production';
        const logging = config.get<string>('NODE_ENV') === 'development';

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: TYPEORM_ENTITIES,
            synchronize,
            logging,
            ssl,
          };
        }
        return {
          type: 'postgres',
          host: config.get<string>('DATABASE_HOST') ?? 'localhost',
          port: parseInt(config.get<string>('DATABASE_PORT') ?? '5432', 10),
          username: config.get<string>('DATABASE_USER') ?? 'postgres',
          password: config.get<string>('DATABASE_PASSWORD') ?? '',
          database: config.get<string>('DATABASE_NAME') ?? 'suministros',
          entities: TYPEORM_ENTITIES,
          synchronize,
          logging,
          ssl,
        };
      },
      inject: [ConfigService],
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    PedidosModule,
    PresupuestosModule,
    SelladosModule,
    PagosModule,
    ArchivosModule,
    ConfigSystemModule,
    ProveedoresModule,
    FinanzasModule,
    ReportesModule,
  ],
})
export class AppModule {}
