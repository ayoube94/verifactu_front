import { useQuery } from '@tanstack/react-query'

/**
 * Estado del backend según su endpoint público de salud (`GET /actuator/health`, fuera del contrato OpenAPI).
 * Devuelve `true` solo con HTTP 200 y `{"status":"UP"}`; cualquier otra cosa (503 DOWN, red caída,
 * respuesta inesperada) es «no disponible».
 */
export async function consultarSalud(): Promise<boolean> {
  try {
    const respuesta = await globalThis.fetch('/actuator/health', { headers: { Accept: 'application/json' } })
    if (!respuesta.ok) return false
    const cuerpo: unknown = await respuesta.json()
    return typeof cuerpo === 'object' && cuerpo !== null && (cuerpo as { status?: unknown }).status === 'UP'
  } catch {
    return false
  }
}

export function useSalud() {
  return useQuery({
    queryKey: ['salud'],
    queryFn: consultarSalud,
    retry: false,
    refetchInterval: 60_000,
  })
}
