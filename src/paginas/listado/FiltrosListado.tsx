import { useState, type FormEvent } from 'react'
import { Boton } from '../../componentes/Boton.tsx'
import { CampoSelect, CampoTexto } from '../../componentes/Campos.tsx'
import { ESTADOS_ENVIO, presentarEstado } from '../../dominio/estadoEnvio.ts'
import estilos from './FiltrosListado.module.css'

/** Filtros del listado tal como se escriben en el formulario (todo texto; vacío = sin filtro). */
export interface ValoresFiltros {
  serie: string
  numero: string
  nifCliente: string
  fechaDesde: string
  fechaHasta: string
  estadoEnvio: string
}

export const FILTROS_VACIOS: ValoresFiltros = { serie: '', numero: '', nifCliente: '', fechaDesde: '', fechaHasta: '', estadoEnvio: '' }

export type CampoFiltro = keyof ValoresFiltros
export const CAMPOS_FILTRO = Object.keys(FILTROS_VACIOS) as CampoFiltro[]

interface Propiedades {
  /** Filtros activos en la URL: el formulario parte de ellos. El padre lo remonta (`key`) si cambian. */
  inicial: ValoresFiltros
  /** Errores del backend asignados a cada filtro (400). */
  errores?: Partial<Record<CampoFiltro, string>>
  onAplicar: (valores: ValoresFiltros) => void
  onQuitar: () => void
}

const MENSAJE_RANGO = 'La fecha desde no puede ser posterior a la fecha hasta'

const hayValores = (valores: ValoresFiltros) => CAMPOS_FILTRO.some((campo) => valores[campo].trim() !== '')

/** Formulario de filtros del listado: se aplican todos juntos al pulsar «Filtrar» (o Intro). */
export function FiltrosListado({ inicial, errores = {}, onAplicar, onQuitar }: Propiedades) {
  const [valores, setValores] = useState<ValoresFiltros>(inicial)
  const [errorRango, setErrorRango] = useState<string>()

  const cambiar = (campo: CampoFiltro) => (evento: { target: { value: string } }) => {
    setValores((anteriores) => ({ ...anteriores, [campo]: evento.target.value }))
    if (campo === 'fechaDesde' || campo === 'fechaHasta') setErrorRango(undefined)
  }

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    // Las fechas ISO ordenan igual como texto que como fechas
    if (valores.fechaDesde && valores.fechaHasta && valores.fechaDesde > valores.fechaHasta) {
      setErrorRango(MENSAJE_RANGO)
      return
    }
    setErrorRango(undefined)
    onAplicar(valores)
  }

  const quitar = () => {
    setValores(FILTROS_VACIOS)
    setErrorRango(undefined)
    onQuitar()
  }

  return (
    <form className={estilos.filtros} noValidate onSubmit={enviar} aria-label="Filtros de facturas">
      <CampoTexto id="filtro-serie" etiqueta="Serie" autoComplete="off" value={valores.serie} onChange={cambiar('serie')} error={errores.serie} />
      <CampoTexto id="filtro-numero" etiqueta="Número" autoComplete="off" value={valores.numero} onChange={cambiar('numero')} error={errores.numero} />
      <CampoTexto
        id="filtro-nif"
        etiqueta="NIF del cliente"
        autoComplete="off"
        value={valores.nifCliente}
        onChange={cambiar('nifCliente')}
        error={errores.nifCliente}
      />
      <CampoTexto
        id="filtro-desde"
        etiqueta="Fecha desde"
        type="date"
        value={valores.fechaDesde}
        onChange={cambiar('fechaDesde')}
        error={errorRango ?? errores.fechaDesde}
      />
      <CampoTexto id="filtro-hasta" etiqueta="Fecha hasta" type="date" value={valores.fechaHasta} onChange={cambiar('fechaHasta')} error={errores.fechaHasta} />
      <CampoSelect id="filtro-estado" etiqueta="Estado ante la AEAT" value={valores.estadoEnvio} onChange={cambiar('estadoEnvio')} error={errores.estadoEnvio}>
        <option value="">Todos</option>
        {ESTADOS_ENVIO.map((estado) => (
          <option key={estado} value={estado}>
            {presentarEstado(estado).texto}
          </option>
        ))}
      </CampoSelect>
      <div className={estilos.acciones}>
        <Boton type="submit" variante="principal">
          Filtrar
        </Boton>
        {(hayValores(valores) || hayValores(inicial)) && <Boton onClick={quitar}>Quitar filtros</Boton>}
      </div>
    </form>
  )
}
