import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { ErrorApi, errorDeRed, errorDesdeRespuesta } from '../api/problemas.ts'
import { MensajeError } from './MensajeError.tsx'

describe('MensajeError', () => {
  test('validación: mensaje general y cada error de campo', () => {
    const error = errorDesdeRespuesta(400, {
      detail: 'Error de validación en los datos de la factura',
      errores: { serie: 'La serie es obligatoria' },
    })
    render(<MensajeError error={error} />)

    const aviso = screen.getByRole('alert')
    expect(aviso).toHaveTextContent('Revisa los datos')
    expect(aviso).toHaveTextContent('Error de validación en los datos de la factura')
    expect(screen.getByRole('listitem')).toHaveTextContent('La serie es obligatoria')
  })

  test('validación: el formulario puede ocultar la lista de campos', () => {
    const error = errorDesdeRespuesta(400, { detail: 'Error', errores: { serie: 'La serie es obligatoria' } })
    render(<MensajeError error={error} ocultarCampos />)
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  test('conflicto: muestra el mensaje del backend como conflicto', () => {
    render(<MensajeError error={errorDesdeRespuesta(409, { detail: 'Ya existe una factura con la serie 2026 y número 001' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('No se puede completar la operación')
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe una factura con la serie 2026 y número 001')
  })

  test('no encontrado: mensaje propio, sin texto técnico', () => {
    render(<MensajeError error={errorDesdeRespuesta(404, '')} mensajeNoEncontrado="No existe ninguna factura con el id 42." />)
    expect(screen.getByRole('alert')).toHaveTextContent('No encontrado')
    expect(screen.getByRole('alert')).toHaveTextContent('No existe ninguna factura con el id 42.')
  })

  test('no autorizado: invita a recargar y no pide credenciales', async () => {
    const recargar = vi.fn<() => void>()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload: recargar })
    render(<MensajeError error={errorDesdeRespuesta(401, '')} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Acceso no autorizado')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Recargar la página' }))
    expect(recargar).toHaveBeenCalled()
  })

  test('servidor: mensaje genérico con el errorId y reintento', async () => {
    const onReintentar = vi.fn<() => void>()
    const error = errorDesdeRespuesta(500, {
      detail: 'Se ha producido un error inesperado en el servidor',
      errorId: '3f6c2a1e-9b7d',
    })
    render(<MensajeError error={error} onReintentar={onReintentar} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Error del servidor')
    expect(screen.getByText('3f6c2a1e-9b7d')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledOnce()
  })

  test('red: indica que no hay conexión y permite reintentar', async () => {
    const onReintentar = vi.fn<() => void>()
    render(<MensajeError error={errorDeRed(new TypeError('Failed to fetch'))} onReintentar={onReintentar} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión con el servicio')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledOnce()
  })

  test('un error desconocido se presenta como fallo de conexión', () => {
    render(<MensajeError error={new Error('cualquier cosa')} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión con el servicio')
    expect(new ErrorApi({ tipo: 'red' }).detalle.tipo).toBe('red')
  })
})
