/**
 * Unit tests — PedidosService
 *
 * Todas las dependencias externas (TypeORM repos, servicios internos)
 * se sustituyen con mocks de Jest. No se necesita base de datos ni
 * instancia de NestJS completa.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PedidosService } from '../pedidos.service';
import { Pedido, PedidoStage } from '../pedido.entity';
import { PedidoComentario } from '../pedido-comentario.entity';
import { PedidoAuditLog } from '../pedido-audit-log.entity';
import { PresupuestosService } from '../../presupuestos/presupuestos.service';
import { ConfigSystemService } from '../../config/config.service';
import { ArchivosService } from '../../archivos/archivos.service';
import { UsersService } from '../../users/users.service';
import { OrdenCompraService } from '../../orden-compra/orden-compra.service';
import { AreaMunicipal } from '../../common/enums/area-municipal.enum';
import { UserRole } from '../../users/user.entity';
import type { User } from '../../users/user.entity';

// ── factories ─────────────────────────────────────────────────────────────────

const PEDIDO_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const USER_ID   = 'ffffffff-0000-1111-2222-333333333333';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: USER_ID,
    rol: UserRole.ADMIN,
    areasPedidoPermitidas: null, // null = todas las áreas permitidas
    ...overrides,
  } as User;
}

function makePedido(overrides: Partial<Pedido> = {}): Pedido {
  return {
    id: PEDIDO_ID,
    numero: 'P-001',
    descripcion: 'Resmas papel A4',
    area: AreaMunicipal.SISTEMAS,
    stage: PedidoStage.APROBACION,
    urgente: false,
    bloqueado: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as unknown as Pedido;
}

// ── setup ─────────────────────────────────────────────────────────────────────

describe('PedidosService', () => {
  let service: PedidosService;
  let pedidosRepo: jest.Mocked<{
    count: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  }>;
  let auditLogRepo: jest.Mocked<{
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    delete: jest.Mock;
  }>;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let archivosService: jest.Mocked<
    Pick<ArchivosService, 'isStorageAvailable' | 'uploadReferenciaPedido' | 'deleteFile'>
  >;

  beforeEach(async () => {
    // Arrange — repos
    pedidosRepo = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ ...x, id: PEDIDO_ID })),
      remove: jest.fn((x) => Promise.resolve(x)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const comentariosRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
    };

    auditLogRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    usersService = {
      findById: jest.fn().mockResolvedValue(makeUser()),
    };

    archivosService = {
      isStorageAvailable: jest.fn().mockReturnValue(false),
      uploadReferenciaPedido: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: getRepositoryToken(Pedido), useValue: pedidosRepo },
        { provide: getRepositoryToken(PedidoComentario), useValue: comentariosRepo },
        { provide: getRepositoryToken(PedidoAuditLog), useValue: auditLogRepo },
        { provide: PresupuestosService, useValue: { findByPedido: jest.fn().mockResolvedValue([]) } },
        { provide: ConfigSystemService, useValue: { get: jest.fn() } },
        { provide: ArchivosService, useValue: archivosService },
        { provide: UsersService, useValue: usersService },
        { provide: OrdenCompraService, useValue: { generarOrdenCompra: jest.fn() } },
      ],
    }).compile();

    service = module.get(PedidosService);
  });

  // ── create ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('crea el pedido con stage APROBACION y lo guarda', async () => {
      // Arrange
      const dto = { descripcion: 'Resmas A4', area: AreaMunicipal.SISTEMAS };
      const user = makeUser();

      // Act
      const result = await service.create(dto, user, []);

      // Assert
      expect(pedidosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ descripcion: 'Resmas A4', stage: PedidoStage.APROBACION }),
      );
      expect(pedidosRepo.save).toHaveBeenCalled();
      expect(result.id).toBe(PEDIDO_ID);
    });

    it('crea el pedido con todos los campos opcionales', async () => {
      // Arrange
      const dto = {
        descripcion: 'Sillas ergonómicas',
        area: AreaMunicipal.RRHH,
        cantidad: '10 unidades',
        detalle: 'Marca: Herman Miller\nModelo: Aeron\nN° de parte / código: HM-AER\nNotas extra',
        urgente: true,
        areaDestino: AreaMunicipal.GOBIERNO,
      };
      const user = makeUser();

      // Act
      const result = await service.create(dto, user, []);

      // Assert
      expect(pedidosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          descripcion: 'Sillas ergonómicas',
          cantidad: '10 unidades',
          urgente: true,
          stage: PedidoStage.APROBACION,
        }),
      );
      expect(result.id).toBe(PEDIDO_ID);
    });

    it('persiste urgente: true cuando se envía el flag', async () => {
      // Arrange
      const dto = { descripcion: 'Tóner HP urgente', area: AreaMunicipal.SISTEMAS, urgente: true };
      const user = makeUser();

      // Act
      await service.create(dto, user, []);

      // Assert
      expect(pedidosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ urgente: true }),
      );
    });

    it('lanza ForbiddenException si el área no está permitida para el usuario', async () => {
      // Arrange — usuario con área restringida
      usersService.findById.mockResolvedValue(
        makeUser({ areasPedidoPermitidas: [AreaMunicipal.SISTEMAS] }),
      );
      const dto = { descripcion: 'Algo', area: AreaMunicipal.COMPRAS };
      const user = makeUser();

      // Act & Assert
      await expect(service.create(dto, user, [])).rejects.toThrow(ForbiddenException);
      expect(pedidosRepo.save).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si se adjuntan imágenes sin storage configurado', async () => {
      // Arrange
      archivosService.isStorageAvailable.mockReturnValue(false);
      const dto = { descripcion: 'Con imagen', area: AreaMunicipal.SISTEMAS };
      const user = makeUser();
      const fakeFile = { originalname: 'img.jpg', buffer: Buffer.from('') } as Express.Multer.File;

      // Act & Assert
      await expect(service.create(dto, user, [fakeFile])).rejects.toThrow(BadRequestException);
    });
  });

  // ── findById ─────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('devuelve el pedido cuando existe', async () => {
      // Arrange
      const pedido = makePedido();
      pedidosRepo.findOne.mockResolvedValue(pedido);

      // Act
      const result = await service.findById(PEDIDO_ID);

      // Assert
      expect(result).toEqual(pedido);
      expect(pedidosRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: PEDIDO_ID } }),
      );
    });

    it('lanza NotFoundException cuando el pedido no existe', async () => {
      // Arrange
      pedidosRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('id-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('permite eliminar un pedido en aprobación a su creador', async () => {
      const owner = makeUser({ id: USER_ID, rol: UserRole.COMPRAS });
      const pedido = makePedido({
        stage: PedidoStage.APROBACION,
        creadoPor: owner,
        referenciasImagenes: [{ url: 'http://local/ref.png', path: 'referencias/ref.png' }],
      });
      pedidosRepo.findOne.mockResolvedValue(pedido);

      const result = await service.remove(PEDIDO_ID, owner);

      expect(pedidosRepo.remove).toHaveBeenCalledWith(pedido);
      expect(auditLogRepo.delete).toHaveBeenCalledWith({ pedidoId: PEDIDO_ID });
      expect(archivosService.deleteFile).toHaveBeenCalledWith('referencias/ref.png');
      expect(result).toEqual({ deleted: true, id: PEDIDO_ID });
    });

    it('rechaza la eliminación si el pedido ya salió de aprobación', async () => {
      const pedido = makePedido({ stage: PedidoStage.PRESUPUESTOS, creadoPor: makeUser() });
      pedidosRepo.findOne.mockResolvedValue(pedido);

      await expect(service.remove(PEDIDO_ID, makeUser())).rejects.toThrow(BadRequestException);
      expect(pedidosRepo.remove).not.toHaveBeenCalled();
    });

    it('rechaza la eliminación si el usuario no es owner, Secretaría, Admin ni Sistemas', async () => {
      const owner = makeUser({ id: 'owner-id', rol: UserRole.COMPRAS });
      const pedido = makePedido({ stage: PedidoStage.APROBACION, creadoPor: owner });
      pedidosRepo.findOne.mockResolvedValue(pedido);

      await expect(
        service.remove(PEDIDO_ID, makeUser({ id: 'otro-id', rol: UserRole.COMPRAS })),
      ).rejects.toThrow(ForbiddenException);
      expect(pedidosRepo.remove).not.toHaveBeenCalled();
    });
  });
});
