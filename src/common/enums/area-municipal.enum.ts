/** Áreas municipales (pedidos y permisos de usuario). */
export enum AreaMunicipal {
  AUTOMOTORES = 'Automotores',
  COMPRAS = 'Compras',
  CULTURA = 'Cultura',
  GOBIERNO = 'Gobierno',
  GUARDIA_URBANA = 'Guardia Urbana',
  HACIENDA = 'Hacienda',
  LICENCIA_DE_CONDUCIR = 'Licencia de Conducir',
  MEDIO_AMBIENTE = 'Medio Ambiente',
  OBRAS_PUBLICAS = 'Obras Públicas',
  RENTAS = 'Rentas',
  RRHH = 'RRHH',
  SECRETARIA_AREA = 'Secretaría',
  SISTEMAS = 'Sistemas',
  TESORERIA_AREA = 'Tesorería',
  TURISMO_Y_DEPORTES = 'Turismo y Deportes',
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
