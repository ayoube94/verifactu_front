import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { renderizarRuta } from '../pruebas/renderizar.tsx'

test('una URL desconocida muestra la página de no encontrado dentro del armazón y enlaza a inicio', async () => {
  const { router } = renderizarRuta('/una/ruta/inexistente')

  expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument()
  expect(screen.getByText('/una/ruta/inexistente')).toBeInTheDocument()
  expect(screen.getByRole('banner')).toHaveTextContent('Zefact')
  await waitFor(() => expect(document.title).toBe('Página no encontrada · Zefact'))

  await userEvent.click(screen.getByRole('link', { name: 'Volver a inicio' }))
  expect(router.state.location.pathname).toBe('/')
})
