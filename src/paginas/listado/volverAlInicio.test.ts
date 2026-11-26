import { describe, expect, it, vi } from 'vitest'
import { volverAlInicioDeLaTabla } from './volverAlInicio.ts'

function elementoCon(top: number, scrollIntoView: unknown = vi.fn<(opciones: ScrollIntoViewOptions) => void>()) {
  const elemento = document.createElement('output')
  elemento.getBoundingClientRect = () => ({ top }) as DOMRect
  ;(elemento as unknown as { scrollIntoView: unknown }).scrollIntoView = scrollIntoView
  return elemento
}

describe('volverAlInicioDeLaTabla', () => {
  it('se desplaza, sin animación, cuando el inicio queda por encima de lo visible', () => {
    const scrollIntoView = vi.fn<(opciones: ScrollIntoViewOptions) => void>()
    volverAlInicioDeLaTabla(elementoCon(-300, scrollIntoView))
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'start', behavior: 'instant' })
  })

  it.each([0, 120])('no se desplaza si el inicio ya se ve (top %i)', (top) => {
    const scrollIntoView = vi.fn<(opciones: ScrollIntoViewOptions) => void>()
    volverAlInicioDeLaTabla(elementoCon(top, scrollIntoView))
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('no falla si el navegador no tiene scrollIntoView', () => {
    expect(() => volverAlInicioDeLaTabla(elementoCon(-300, undefined))).not.toThrow()
  })

  it('no falla con un elemento nulo', () => {
    expect(() => volverAlInicioDeLaTabla(null)).not.toThrow()
  })
})
