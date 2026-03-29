import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { Proveedor } from './proveedor.entity';
import { ProveedorComentario } from './proveedor-comentario.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { Pago } from '../pagos/pagos.module';
import { Presupuesto } from '../presupuestos/presupuesto.entity';
import { User } from '../users/user.entity';

describe('ProveedoresService (CRUD)', () => {
  let service: ProveedoresService;
  let proveedorRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  const proveedorId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  beforeEach(async () => {
    proveedorRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
      delete: jest.fn().mockResolvedValue({ affected: 1, raw: [] }),
    };

    const comentariosRepo = {
      find: jest.fn(() => []),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
      findOneOrFail: jest.fn(),
    };

    const pedidosRepo = {
      find: jest.fn(() => []),
    };

    const pagosRepo = {
      findOne: jest.fn(),
    };

    const presupuestosRepo = {
      find: jest.fn(() => []),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProveedoresService,
        { provide: getRepositoryToken(Proveedor), useValue: proveedorRepo },
        { provide: getRepositoryToken(ProveedorComentario), useValue: comentariosRepo },
        { provide: getRepositoryToken(Pedido), useValue: pedidosRepo },
        { provide: getRepositoryToken(Pago), useValue: pagosRepo },
        { provide: getRepositoryToken(Presupuesto), useValue: presupuestosRepo },
      ],
    }).compile();

    service = module.get(ProveedoresService);
  });

  describe('create', () => {
    it('persiste razón social, CUIT, domicilio y email en minúsculas', async () => {
      await service.create({
        nombre: '  Test S.A.  ',
        cuit: '30-12345678-9',
        condicionIva: 'Responsable inscripto',
        domicilioCalle: 'Calle 1',
        localidad: 'Rada Tilly',
        provincia: 'Chubut',
        codigoPostal: '9401',
        email: 'Ventas@TEST.COM',
        telefono: '2804123456',
      });

      expect(proveedorRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Test S.A.',
          cuit: '30-12345678-9',
          condicionIva: 'Responsable inscripto',
          domicilioCalle: 'Calle 1',
          localidad: 'Rada Tilly',
          provincia: 'Chubut',
          codigoPostal: '9401',
          email: 'ventas@test.com',
          telefono: '2804123456',
        }),
      );
      expect(proveedorRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll / findById', () => {
    it('findAll delega en el repositorio con orden por nombre', async () => {
      proveedorRepo.find.mockResolvedValue([]);
      await service.findAll();
      expect(proveedorRepo.find).toHaveBeenCalledWith({ order: { nombre: 'ASC' } });
    });

    it('findById lanza NotFoundException si no existe', async () => {
      proveedorRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(proveedorId)).rejects.toThrow(NotFoundException);
    });

    it('findById devuelve el proveedor', async () => {
      const p = { id: proveedorId, nombre: 'X' } as Proveedor;
      proveedorRepo.findOne.mockResolvedValue(p);
      await expect(service.findById(proveedorId)).resolves.toEqual(p);
    });
  });

  describe('update', () => {
    it('fusiona solo los campos enviados y guarda', async () => {
      const existing: Proveedor = {
        id: proveedorId,
        nombre: 'Viejo S.A.',
        nombreFantasia: null,
        cuit: '30-11111111-1',
        condicionIva: 'Monotributo',
        domicilioCalle: 'A',
        localidad: 'X',
        provincia: 'Y',
        codigoPostal: '1000',
        telefono: null,
        email: null,
        contacto: null,
        notas: null,
        createdAt: new Date(),
      };
      proveedorRepo.findOne.mockResolvedValue(existing);
      proveedorRepo.save.mockImplementation((x) => Promise.resolve(x as Proveedor));

      const out = await service.update(proveedorId, {
        nombre: 'Nuevo S.A.',
        localidad: 'Rada Tilly',
      });

      expect(out.nombre).toBe('Nuevo S.A.');
      expect(out.localidad).toBe('Rada Tilly');
      expect(out.cuit).toBe('30-11111111-1');
      expect(proveedorRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina por id tras verificar existencia', async () => {
      proveedorRepo.findOne.mockResolvedValue({ id: proveedorId, nombre: 'Z' } as Proveedor);
      const res = await service.remove(proveedorId);
      expect(res).toEqual({ deleted: true, id: proveedorId });
      expect(proveedorRepo.delete).toHaveBeenCalledWith(proveedorId);
    });

    it('no elimina si el id no existe', async () => {
      proveedorRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(proveedorId)).rejects.toThrow(NotFoundException);
      expect(proveedorRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('getFacturasAsociadas', () => {
    it('devuelve lista vacía si no hay pedidos ni presupuestos', async () => {
      proveedorRepo.findOne.mockResolvedValue({ id: proveedorId, nombre: 'Solo' } as Proveedor);
      const items = await service.getFacturasAsociadas(proveedorId);
      expect(items).toEqual([]);
    });
  });

  describe('comentarios', () => {
    it('addComentario guarda y devuelve con usuario', async () => {
      const comentariosRepo = {
        find: jest.fn(),
        create: jest.fn((x) => x),
        save: jest.fn((x) => Promise.resolve({ ...x, id: 'c1' })),
        findOneOrFail: jest.fn(() =>
          Promise.resolve({
            id: 'c1',
            texto: 'Hola',
            usuario: { nombre: 'A', apellido: 'B' },
          }),
        ),
      };
      proveedorRepo.findOne.mockResolvedValue({ id: proveedorId, nombre: 'P' } as Proveedor);

      const module = await Test.createTestingModule({
        providers: [
          ProveedoresService,
          { provide: getRepositoryToken(Proveedor), useValue: proveedorRepo },
          { provide: getRepositoryToken(ProveedorComentario), useValue: comentariosRepo },
          { provide: getRepositoryToken(Pedido), useValue: { find: jest.fn(() => []) } },
          { provide: getRepositoryToken(Pago), useValue: { findOne: jest.fn() } },
          { provide: getRepositoryToken(Presupuesto), useValue: { find: jest.fn(() => []) } },
        ],
      }).compile();

      const svc = module.get(ProveedoresService);
      const u = { id: 'u1' } as User;
      const row = await svc.addComentario(proveedorId, '  Hola  ', u);

      expect(comentariosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ proveedorId, usuarioId: 'u1', texto: 'Hola' }),
      );
      expect(row.texto).toBe('Hola');
    });
  });
});
