import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FinanzasService } from './finanzas.module';
import { Pago } from '../pagos/pagos.module';

describe('FinanzasService', () => {
  let service: FinanzasService;
  let createQueryBuilder: jest.Mock;

  beforeEach(async () => {
    const queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    createQueryBuilder = jest.fn(() => queryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanzasService,
        {
          provide: getRepositoryToken(Pago),
          useValue: { createQueryBuilder },
        },
      ],
    }).compile();

    service = module.get(FinanzasService);
  });

  it('agrega gastos por mes, área y proveedor', async () => {
    createQueryBuilder().getRawMany.mockResolvedValue([
      {
        id: '1',
        pedidoId: 'p-1',
        pedidoNumero: 'P-001',
        descripcion: 'Papel',
        area: 'Sistemas',
        proveedor: 'ACME',
        fechaPago: '2026-02-15',
        mes: '2026-02',
        montoPagado: '100000',
        numeroTransferencia: 'TRF-1',
        facturaUrl: null,
      },
      {
        id: '2',
        pedidoId: 'p-2',
        pedidoNumero: 'P-002',
        descripcion: 'Tintas',
        area: 'Sistemas',
        proveedor: 'ACME',
        fechaPago: '2026-02-20',
        mes: '2026-02',
        montoPagado: '50000',
        numeroTransferencia: 'TRF-2',
        facturaUrl: null,
      },
      {
        id: '3',
        pedidoId: 'p-3',
        pedidoNumero: 'P-003',
        descripcion: 'Herramientas',
        area: 'Obras Públicas',
        proveedor: 'Beta',
        fechaPago: '2026-03-01',
        mes: '2026-03',
        montoPagado: '80000',
        numeroTransferencia: 'TRF-3',
        facturaUrl: 'https://example.com/factura.pdf',
      },
    ]);

    const resumen = await service.getResumen({ year: 2026 });

    expect(resumen.totalGastado).toBe(230000);
    expect(resumen.cantidadPagos).toBe(3);
    expect(resumen.areaMayorGasto).toEqual({ area: 'Sistemas', total: 150000 });
    expect(resumen.proveedorMayorGasto).toEqual({ proveedor: 'ACME', total: 150000 });
    expect(resumen.porMes).toEqual([
      { mes: '2026-02', total: 150000 },
      { mes: '2026-03', total: 80000 },
    ]);
    expect(resumen.porArea).toEqual([
      { area: 'Sistemas', mes: '2026-02', total: 150000 },
      { area: 'Obras Públicas', mes: '2026-03', total: 80000 },
    ]);
    expect(resumen.porProveedor).toEqual([
      { proveedor: 'ACME', mes: '2026-02', total: 150000 },
      { proveedor: 'Beta', mes: '2026-03', total: 80000 },
    ]);
  });

  it('filtra por área y proveedor cuando vienen en query', async () => {
    createQueryBuilder().getRawMany.mockResolvedValue([]);

    await service.getGastos({ year: 2026, area: 'Sistemas', proveedor: 'ACME' });

    const builder = createQueryBuilder();
    expect(builder.where).toHaveBeenCalledWith(
      'EXTRACT(YEAR FROM pago.fechaPago) = :year',
      { year: 2026 },
    );
    expect(builder.andWhere).toHaveBeenNthCalledWith(1, 'pedido.area = :area', { area: 'Sistemas' });
    expect(builder.andWhere).toHaveBeenNthCalledWith(
      2,
      "COALESCE(NULLIF(TRIM(pedido.proveedorSeleccionado), ''), 'Sin proveedor') = :proveedor",
      { proveedor: 'ACME' },
    );
  });
});
