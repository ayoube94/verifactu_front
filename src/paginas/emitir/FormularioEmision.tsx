import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Boton } from '../../componentes/Boton.tsx'
import { CampoSelect, CampoTexto } from '../../componentes/Campos.tsx'
import { aTexto, calcularLinea, calcularTotales, type LineaNumerica } from '../../utilidades/importes.ts'
import { formatearImporte } from '../../utilidades/formato.ts'
import {
  esquemaFormulario,
  REGIMENES_IVA,
  TIPOS_FACTURA,
  TIPOS_IVA,
  valoresIniciales,
  type ValoresFormulario,
  type ValoresValidados,
} from './esquema.ts'
import estilos from './FormularioEmision.module.css'

/** Pasa una línea del formulario (nombres de campo de la API) a la forma numérica de importes. */
const aNumerica = (l: ValoresFormulario['lineas'][number]): LineaNumerica => ({
  cantidad: l.cantidad,
  precio: l.precioUnitario,
  descuento: l.descuento,
  tipo: l.tipoIva,
})

const DESCRIPCION_TIPO: Record<(typeof TIPOS_FACTURA)[number], string> = {
  F1: 'Factura ordinaria',
  F2: 'Factura simplificada',
  F3: 'Factura emitida en sustitución de simplificadas',
  R1: 'Rectificativa por error fundado en derecho',
  R2: 'Rectificativa por modificación de base imponible',
  R3: 'Rectificativa por bonificaciones posteriores',
  R4: 'Rectificativa, resto de supuestos',
  R5: 'Rectificativa en facturas simplificadas',
}

const CODIGO_REGIMEN: Record<(typeof REGIMENES_IVA)[number], string> = {
  REGIMEN_GENERAL: '01 · Régimen general',
  EXPORTACION: '02 · Exportación',
  BIENES_USADOS: '03 · Bienes usados, objetos de arte y antigüedades',
  ORO_INVERSION: '04 · Oro de inversión',
  AGENCIAS_VIAJES: '05 · Agencias de viajes',
  GRUPO_ENTIDADES: '06 · Grupo de entidades',
  CRITERIO_CAJA: '07 · Criterio de caja',
  SIMPLIFICADO: '08 · Recargo de equivalencia',
}

interface Propiedades {
  /** Recibe los valores ya validados y en formato de petición; la emisión la hace la página. */
  onEnviar: (valores: ValoresValidados) => void
  enviando?: boolean
}

export function FormularioEmision({ onEnviar, enviando = false }: Propiedades) {
  const prefijo = useId()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquemaFormulario),
    defaultValues: valoresIniciales(),
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'lineas' })
  const lineas = useWatch({ control, name: 'lineas' })
  const totales = calcularTotales(lineas.map(aNumerica))

  const enviar = handleSubmit((valores) => {
    if (enviando) return
    onEnviar(esquemaFormulario.parse(valores))
  })

  const errorCabecera = (campo: 'serie' | 'numero' | 'fechaExpedicion' | 'descripcionOperacion') => errors[campo]?.message
  const id = (nombre: string) => `${prefijo}-${nombre}`

  return (
    <form className={estilos.formulario} onSubmit={enviar} noValidate aria-labelledby={`${prefijo}-titulo`}>
      <section className={estilos.bloque} aria-labelledby={`${prefijo}-cabecera`}>
        <h2 id={`${prefijo}-cabecera`} className={estilos.subtitulo}>
          Factura
        </h2>
        <div className={estilos.cabecera}>
          <CampoTexto id={id('serie')} etiqueta="Serie" {...register('serie')} error={errorCabecera('serie')} autoComplete="off" />
          <CampoTexto id={id('numero')} etiqueta="Número" {...register('numero')} error={errorCabecera('numero')} autoComplete="off" />
          <CampoTexto
            id={id('fecha')}
            type="date"
            etiqueta="Fecha de expedición"
            {...register('fechaExpedicion')}
            error={errorCabecera('fechaExpedicion')}
          />
          <CampoSelect id={id('tipo')} etiqueta="Tipo de factura" {...register('tipoFactura')}>
            {TIPOS_FACTURA.map((t) => (
              <option key={t} value={t}>
                {t} · {DESCRIPCION_TIPO[t]}
              </option>
            ))}
          </CampoSelect>
          <CampoSelect id={id('regimen')} etiqueta="Régimen de IVA" {...register('regimenIva')}>
            {REGIMENES_IVA.map((r) => (
              <option key={r} value={r}>
                {CODIGO_REGIMEN[r]}
              </option>
            ))}
          </CampoSelect>
          <CampoTexto
            id={id('descripcion')}
            etiqueta="Descripción de la operación"
            className={estilos.anchoCompleto}
            {...register('descripcionOperacion')}
            error={errorCabecera('descripcionOperacion')}
          />
        </div>
      </section>

      <section className={estilos.bloque} aria-labelledby={`${prefijo}-destinatario`}>
        <h2 id={`${prefijo}-destinatario`} className={estilos.subtitulo}>
          Destinatario
        </h2>
        <p className={estilos.nota}>Obligatorio salvo en las facturas simplificadas (F2 y R5).</p>
        <div className={estilos.destinatario}>
          <CampoTexto id={id('nif')} etiqueta="NIF" {...register('cliente.nif')} error={errors.cliente?.nif?.message} autoComplete="off" />
          <CampoTexto
            id={id('razon')}
            etiqueta="Nombre o razón social"
            className={estilos.anchoCompleto}
            {...register('cliente.nombreRazonSocial')}
            error={errors.cliente?.nombreRazonSocial?.message}
          />
          <CampoTexto id={id('direccion')} etiqueta="Dirección" className={estilos.anchoCompleto} {...register('cliente.direccion')} />
          <CampoTexto id={id('cp')} etiqueta="Código postal" {...register('cliente.codigoPostal')} />
          <CampoTexto id={id('ciudad')} etiqueta="Ciudad" {...register('cliente.ciudad')} />
          <CampoTexto id={id('pais')} etiqueta="País" {...register('cliente.pais')} />
        </div>
      </section>

      <section className={estilos.bloque} aria-labelledby={`${prefijo}-lineas`}>
        <h2 id={`${prefijo}-lineas`} className={estilos.subtitulo}>
          Líneas
        </h2>
        {errors.lineas?.root?.message && <p className={estilos.errorGeneral}>{errors.lineas.root.message}</p>}
        {typeof errors.lineas?.message === 'string' && <p className={estilos.errorGeneral}>{errors.lineas.message}</p>}

        <ol className={estilos.lineas}>
          {fields.map((campo, i) => {
            const numero = i + 1
            const resultado = lineas[i] ? calcularLinea(aNumerica(lineas[i])) : null
            const e = errors.lineas?.[i]
            const lp = (nombre: string) => id(`l${i}-${nombre}`)
            return (
              <li key={campo.id} className={estilos.linea}>
                <span className={estilos.numeroLinea}>Línea {numero}</span>
                <CampoTexto
                  id={lp('descripcion')}
                  etiqueta={`Descripción, línea ${numero}`}
                  etiquetaOculta
                  className={estilos.descripcion}
                  {...register(`lineas.${i}.descripcion`)}
                  error={e?.descripcion?.message}
                />
                <CampoTexto
                  id={lp('cantidad')}
                  etiqueta="Cantidad"
                  inputMode="decimal"
                  {...register(`lineas.${i}.cantidad`)}
                  error={e?.cantidad?.message}
                />
                <CampoTexto
                  id={lp('precio')}
                  etiqueta="Precio unitario (€)"
                  inputMode="decimal"
                  {...register(`lineas.${i}.precioUnitario`)}
                  error={e?.precioUnitario?.message}
                />
                <CampoTexto
                  id={lp('descuento')}
                  etiqueta="Descuento (€)"
                  ayuda="Importe en euros, no porcentaje"
                  inputMode="decimal"
                  {...register(`lineas.${i}.descuento`)}
                  error={e?.descuento?.message}
                />
                <CampoSelect id={lp('iva')} etiqueta="IVA" {...register(`lineas.${i}.tipoIva`)} error={e?.tipoIva?.message}>
                  {TIPOS_IVA.map((t) => (
                    <option key={t} value={t}>
                      {t} %
                    </option>
                  ))}
                </CampoSelect>
                <span className={estilos.importeLinea} aria-label={`Base de la línea ${numero}`}>
                  {resultado ? formatearImporte(aTexto(resultado.base, 2)) : '—'}
                </span>
                <Boton
                  className={estilos.quitar}
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                  aria-label={`Quitar línea ${numero}`}
                >
                  Quitar
                </Boton>
              </li>
            )
          })}
        </ol>
        <Boton className={estilos.anadir} onClick={() => append({ descripcion: '', cantidad: '1', precioUnitario: '', descuento: '0', tipoIva: '21' })}>
          Añadir línea
        </Boton>
      </section>

      <section className={estilos.totales} aria-labelledby={`${prefijo}-totales`}>
        <h2 id={`${prefijo}-totales`} className={estilos.subtitulo}>
          Totales <span className={estilos.orientativo}>(orientativos)</span>
        </h2>
        <dl className={estilos.filas}>
          <div>
            <dt>Base imponible</dt>
            <dd>{formatearImporte(aTexto(totales.base, 2))}</dd>
          </div>
          <div>
            <dt>Cuota de IVA</dt>
            <dd>{formatearImporte(aTexto(totales.cuota, 2))}</dd>
          </div>
          <div className={estilos.total}>
            <dt>Importe total</dt>
            <dd>{formatearImporte(aTexto(totales.total, 2))}</dd>
          </div>
        </dl>
        <p className={estilos.nota}>El backend calcula los importes definitivos al emitir.</p>
        <div className={estilos.acciones}>
          <Boton variante="principal" type="submit" ocupado={enviando}>
            {enviando ? 'Emitiendo…' : 'Emitir'}
          </Boton>
        </div>
      </section>
    </form>
  )
}
