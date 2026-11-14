import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import indexHtml from '../../index.html?raw'
import { describe, expect, test } from 'vitest'
import { renderizarRuta } from '../pruebas/renderizar.tsx'
import { secciones } from './secciones.ts'

describe('armazón común', () => {
  test('el primer Tab enfoca «Saltar al contenido», que lleva al contenido principal', async () => {
    renderizarRuta('/')
    const usuario = userEvent.setup()

    await usuario.tab()

    const saltar = screen.getByRole('link', { name: 'Saltar al contenido' })
    expect(saltar).toHaveFocus()
    expect(saltar).toHaveAttribute('href', '#contenido')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido')
  })

  test('la cabecera muestra el producto y solo las secciones existentes, con la actual marcada', () => {
    renderizarRuta('/')

    expect(screen.getByRole('banner')).toHaveTextContent('Zefact')
    const navegacion = screen.getByRole('navigation', { name: 'Principal' })
    const enlaces = within(navegacion).getAllByRole('link')
    expect(enlaces.map((enlace) => enlace.textContent)).toEqual(secciones.map((s) => s.etiqueta))
    expect(within(navegacion).getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
  })

  test('cada pantalla pone su título en el documento', async () => {
    renderizarRuta('/')
    await waitFor(() => expect(document.title).toBe('Inicio · Zefact'))
  })

  test('index.html declara el idioma español', () => {
    expect(indexHtml).toMatch(/<html lang="es">/)
  })
})
