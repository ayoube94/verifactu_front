import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'
import { renderizarRuta } from '../pruebas/renderizar.tsx'
import { servidor } from '../pruebas/servidor.ts'

const estado = () => within(screen.getByRole('banner')).getByRole('status')

/** Comprueba que el resto de la interfaz sigue usable mientras el servicio no responde. */
async function sigueUsable() {
  const usuario = userEvent.setup()
  await usuario.click(screen.getByRole('link', { name: 'Inicio' }))
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
}

describe('estado del servicio', () => {
  test('UP → operativo', async () => {
    servidor.use(http.get('/actuator/health', () => HttpResponse.json({ status: 'UP', groups: ['liveness', 'readiness'] })))
    renderizarRuta('/')

    expect(await within(screen.getByRole('banner')).findByText('operativo')).toBeInTheDocument()
    expect(estado()).toHaveTextContent('Servicio operativo')
  })

  test('DOWN con 503 → no disponible, y la interfaz sigue usable', async () => {
    servidor.use(http.get('/actuator/health', () => HttpResponse.json({ status: 'DOWN' }, { status: 503 })))
    renderizarRuta('/')

    expect(await within(screen.getByRole('banner')).findByText('no disponible')).toBeInTheDocument()
    await sigueUsable()
  })

  test('fallo de red → no disponible, y la interfaz sigue usable', async () => {
    servidor.use(http.get('/actuator/health', () => HttpResponse.error()))
    renderizarRuta('/')

    expect(await within(screen.getByRole('banner')).findByText('no disponible')).toBeInTheDocument()
    await sigueUsable()
  })

  test('mientras no responde, indica que está comprobando', () => {
    servidor.use(http.get('/actuator/health', () => new Promise<never>(() => {})))
    renderizarRuta('/')

    expect(estado()).toHaveTextContent('Comprobando el servicio…')
  })
})
