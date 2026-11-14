/**
 * Formato regional es-ES. Solo presentación: nunca altera los valores que devuelve la API.
 */

const importe = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  // es-ES por defecto no agrupa los miles en números de 4 cifras ("1210,00 €"); forzamos "1.210,00 €"
  useGrouping: 'always',
})

const fechaHora = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'Europe/Madrid',
})

/** `1210` o `"1210.00"` → `1.210,00 €`. Devuelve cadena vacía si el valor no es numérico. */
export function formatearImporte(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return ''
  const numero = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(numero) ? importe.format(numero) : ''
}

/**
 * `2026-10-14` → `14/10/2026`. Se trabaja sobre el texto de la fecha (LocalDate del backend):
 * convertirla a Date la interpretaría en UTC y podría mostrar el día anterior.
 */
export function formatearFecha(fecha: string | null | undefined): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha ?? '')
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : (fecha ?? '')
}

/**
 * `2026-10-14T20:00:00+02:00` → `14/10/2026 20:00:00`, en hora de Madrid
 * (la zona en que el backend genera los registros VeriFactu).
 */
export function formatearFechaHora(fechaHoraIso: string | null | undefined): string {
  if (!fechaHoraIso) return ''
  const instante = new Date(fechaHoraIso)
  if (Number.isNaN(instante.getTime())) return fechaHoraIso
  return fechaHora.format(instante).replace(',', '')
}
