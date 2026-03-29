/** Áreas municipales (pedidos y permisos de usuario). */
export enum AreaMunicipal {
  ADMINISTRACION = 'Administración',
  OBRAS_PUBLICAS = 'Obras Públicas',
  SISTEMAS = 'Sistemas',
  RRHH = 'RRHH',
  CATASTRO = 'Catastro',
  INTENDENCIA = 'Intendencia',
  TURISMO = 'Turismo',
  TESORERIA_AREA = 'Tesorería',
  SECRETARIA_AREA = 'Secretaría',
}

export const ALL_AREAS_MUNICIPALES = Object.values(AreaMunicipal) as AreaMunicipal[];

/** null = todas las áreas (legacy); [] = ninguna; lista = solo esas. */
export function resolveAreasPedidoPermitidas(
  areas: AreaMunicipal[] | null | undefined,
): AreaMunicipal[] {
  if (areas === null || areas === undefined) return [...ALL_AREAS_MUNICIPALES];
  return areas;
}

export function userMayRequestPedidoForArea(
  areasPedidoPermitidas: AreaMunicipal[] | null | undefined,
  area: AreaMunicipal,
): boolean {
  const allowed = resolveAreasPedidoPermitidas(areasPedidoPermitidas);
  return allowed.length > 0 && allowed.includes(area);
}
