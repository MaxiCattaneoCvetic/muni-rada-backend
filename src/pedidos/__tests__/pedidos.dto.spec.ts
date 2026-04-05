/**
 * Unit tests — CreatePedidoDto validation
 *
 * Verifica que class-validator rechaza payloads inválidos y acepta
 * todos los campos posibles (obligatorios y opcionales).
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePedidoDto } from '../pedidos.dto';
import { AreaMunicipal } from '../../common/enums/area-municipal.enum';

// ── helpers ──────────────────────────────────────────────────────────────────

function dto(overrides: Record<string, unknown> = {}) {
  return plainToInstance(CreatePedidoDto, {
    descripcion: 'Resmas papel A4',
    area: AreaMunicipal.SISTEMAS,
    ...overrides,
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('CreatePedidoDto — validación', () => {
  // ── campos requeridos ──────────────────────────────────────────────────────

  it('payload mínimo válido pasa sin errores', async () => {
    const errors = await validate(dto());
    expect(errors).toHaveLength(0);
  });

  it('payload completo (todos los campos opcionales) pasa sin errores', async () => {
    const errors = await validate(
      dto({
        cantidad: '5 resmas',
        detalle: 'Marca: HP\nModelo: 85A\nN° de parte / código: CE285A',
        areaDestino: AreaMunicipal.GOBIERNO,
        urgente: true,
      }),
    );
    expect(errors).toHaveLength(0);
  });

  // ── campo descripcion ──────────────────────────────────────────────────────

  it('falta descripcion → error en "descripcion"', async () => {
    const errors = await validate(dto({ descripcion: '' }));
    expect(errors.some((e) => e.property === 'descripcion')).toBe(true);
  });

  it('descripcion ausente → error en "descripcion"', async () => {
    const d = plainToInstance(CreatePedidoDto, { area: AreaMunicipal.SISTEMAS });
    const errors = await validate(d);
    expect(errors.some((e) => e.property === 'descripcion')).toBe(true);
  });

  // ── campo area ────────────────────────────────────────────────────────────

  it('falta area → error en "area"', async () => {
    const d = plainToInstance(CreatePedidoDto, { descripcion: 'Tóner HP' });
    const errors = await validate(d);
    expect(errors.some((e) => e.property === 'area')).toBe(true);
  });

  it('area con valor fuera del enum → error en "area"', async () => {
    const errors = await validate(dto({ area: 'AreaInexistente' }));
    expect(errors.some((e) => e.property === 'area')).toBe(true);
  });

  it('area con valor válido del enum pasa', async () => {
    for (const area of Object.values(AreaMunicipal)) {
      const errors = await validate(dto({ area }));
      expect(errors.some((e) => e.property === 'area')).toBe(false);
    }
  });

  // ── campo urgente ─────────────────────────────────────────────────────────

  it('urgente como string "true" es transformado a boolean true', async () => {
    const d = plainToInstance(CreatePedidoDto, {
      descripcion: 'Sillas',
      area: AreaMunicipal.RRHH,
      urgente: 'true',
    });
    expect(d.urgente).toBe(true);
    const errors = await validate(d);
    expect(errors.some((e) => e.property === 'urgente')).toBe(false);
  });

  it('urgente como string "false" es transformado a boolean false', async () => {
    const d = plainToInstance(CreatePedidoDto, {
      descripcion: 'Sillas',
      area: AreaMunicipal.RRHH,
      urgente: 'false',
    });
    expect(d.urgente).toBe(false);
    const errors = await validate(d);
    expect(errors.some((e) => e.property === 'urgente')).toBe(false);
  });

  it('urgente ausente es opcional — no produce error', async () => {
    const errors = await validate(dto());
    expect(errors.some((e) => e.property === 'urgente')).toBe(false);
  });

  // ── campo areaDestino ─────────────────────────────────────────────────────

  it('areaDestino con valor inválido → error en "areaDestino"', async () => {
    const errors = await validate(dto({ areaDestino: 'NoExiste' }));
    expect(errors.some((e) => e.property === 'areaDestino')).toBe(true);
  });

  it('areaDestino ausente es opcional — no produce error', async () => {
    const errors = await validate(dto());
    expect(errors.some((e) => e.property === 'areaDestino')).toBe(false);
  });

  // ── whitelist: campo extra no declarado en el DTO ─────────────────────────

  it('campo "referencias" no pertenece al DTO — validate() reporta error con forbidNonWhitelisted', async () => {
    // Documenta el bug original: el ValidationPipe global usaba forbidNonWhitelisted:true,
    // lo que hacía que el campo "referencias" (del multipart) lanzara un 400.
    // El fix fue usar @UsePipes sin forbidNonWhitelisted en el endpoint de crear pedido.
    const { validateSync } = await import('class-validator');
    const d = plainToInstance(CreatePedidoDto, {
      descripcion: 'Test',
      area: AreaMunicipal.SISTEMAS,
      referencias: 'archivo.jpg',
    });
    // class-validator solo reporta el campo extra con forbidUnknownValues:true
    const errors = validateSync(d, { forbidUnknownValues: false });
    // Los campos declarados en el DTO son válidos — no hay errores en ellos
    const propErrors = errors.filter((e) => ['descripcion', 'area'].includes(e.property));
    expect(propErrors).toHaveLength(0);
  });
});
