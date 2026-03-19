import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PresupuestosModule } from './presupuestos/presupuestos.module';
import { SelladosModule } from './sellados/sellados.module';
import { PagosModule } from './pagos/pagos.module';
import { ArchivosModule } from './archivos/archivos.module';
import { ConfigSystemModule } from './config/config.module';

@Module({
  imports: [
    // Config global
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: parseInt(config.get('DATABASE_PORT', '5432')),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        ssl: config.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production', // auto-migrate en dev
        logging: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    PedidosModule,
    PresupuestosModule,
    SelladosModule,
    PagosModule,
    ArchivosModule,
    ConfigSystemModule,
  ],
})
export class AppModule {}
