/**
 * utils/mesUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FUENTE ÚNICA DE VERDAD para la lógica de meses en todo el sistema.
 *
 * Reglas del sistema:
 *  - GlobalMonthSelector  → valor = "ENERO", "FEBRERO" … | "HISTÓRICO TOTAL"
 *  - Transaccion.mes      → "ENERO", "FEBRERO" … (MAYÚSCULAS, igual al selector)
 *  - PublicacionMensual.mes → "01-2026", "02-2026" … (formato numérico)
 *  - CuentaPorCobrar.mes  → "01-2026", "02-2026" …
 *
 * Esta librería traduce entre formatos y normaliza comparaciones.
 */

/** Lista canónica de meses en el orden del año */
export const MESES_LISTA = [
  'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'
] as const;

export type NombreMes = typeof MESES_LISTA[number];

/** Mapa: nombre de mes → código numérico-año (asume 2026 por defecto) */
const NOMBRE_A_CODIGO: Record<string, string> = {
  'ENERO':      '01-2026',
  'FEBRERO':    '02-2026',
  'MARZO':      '03-2026',
  'ABRIL':      '04-2026',
  'MAYO':       '05-2026',
  'JUNIO':      '06-2026',
  'JULIO':      '07-2026',
  'AGOSTO':     '08-2026',
  'SEPTIEMBRE': '09-2026',
  'OCTUBRE':    '10-2026',
  'NOVIEMBRE':  '11-2026',
  'DICIEMBRE':  '12-2026',
};

/** Mapa inverso: "01-2026" → "ENERO" */
const CODIGO_A_NOMBRE: Record<string, string> = Object.fromEntries(
  Object.entries(NOMBRE_A_CODIGO).map(([k, v]) => [v, k])
);

/**
 * Convierte el valor del GlobalMonthSelector ("ENERO") 
 * al código de PublicacionMensual ("01-2026").
 * Retorna null si es "HISTÓRICO TOTAL".
 */
export function selectorToCodigoPub(filtroMes: string): string | null {
  if (filtroMes === 'HISTÓRICO TOTAL') return null;
  return NOMBRE_A_CODIGO[filtroMes.toUpperCase()] ?? null;
}

/**
 * Convierte el código de PublicacionMensual ("01-2026")
 * al valor del selector ("ENERO").
 */
export function codigoPubToSelector(codigo: string): string {
  return CODIGO_A_NOMBRE[codigo] ?? codigo;
}

/**
 * Normaliza cualquier string de mes a MAYÚSCULAS para comparaciones.
 * Maneja: "Enero", "ENERO", "enero" → "ENERO"
 */
export function normalizarMes(mes: string | null | undefined): string {
  return (mes ?? '').toUpperCase().trim();
}

/**
 * Determina si una transacción (con campo `mes`) coincide con el filtro global.
 * Soporta mes null como "sin mes".
 * 
 * @param mesTx  - El campo `mes` de la transacción (puede ser "ENERO", "Enero", etc.)
 * @param filtroMesGlobal - El valor del GlobalMonthSelector
 */
export function transaccionMatchesMes(
  mesTx: string | null | undefined,
  filtroMesGlobal: string
): boolean {
  if (filtroMesGlobal === 'HISTÓRICO TOTAL') return true;
  if (!mesTx) return false;
  
  const val = normalizarMes(mesTx);
  const filterUpper = filtroMesGlobal.toUpperCase();
  const filterCode = selectorToCodigoPub(filtroMesGlobal);

  return val === filterUpper || val === filterCode || mesTx === filterCode || mesTx === filterUpper;
}

/**
 * Determina si una publicación (con campo `mes` = "01-2026") coincide 
 * con el filtro global (selector = "ENERO").
 */
export function publicacionMatchesMes(
  mesPub: string | null | undefined,
  filtroMesGlobal: string
): boolean {
  if (filtroMesGlobal === 'HISTÓRICO TOTAL') return true;
  if (!mesPub) return false;
  const codigoExpected = selectorToCodigoPub(filtroMesGlobal);
  return mesPub === codigoExpected;
}

/**
 * Etiqueta legible del filtro para mostrar en UI.
 * "HISTÓRICO TOTAL" → "Histórico General"
 * "ENERO" → "Enero 2026"
 */
export function labelFiltro(filtroMesGlobal: string): string {
  if (filtroMesGlobal === 'HISTÓRICO TOTAL') return 'Histórico General (Ene-Mar 2026)';
  const mes = filtroMesGlobal.charAt(0) + filtroMesGlobal.slice(1).toLowerCase();
  return `${mes} 2026`;
}
