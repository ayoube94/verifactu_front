import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router'
import { z } from 'zod'
import { ErrorApi, type VerificacionHuella } from '../../api/problemas.ts'
import { useTituloPagina } from '../../app/useTituloPagina.ts'
import { Boton } from '../../componentes/Boton.tsx'
import { CampoTexto } from '../../componentes/Campos.tsx'
import { MensajeError } from '../../componentes/MensajeError.tsx'
import { formatearFechaHora } from '../../utilidades/formato.ts'
import estilos from '../Pagina.module.css'
import { verificarHuella } from './verificacion.ts'
import formulario from './VerificarHuella.module.css'

const HUELLA_VALIDA = /^[0-9a-fA-F]{64}$/

const esquemaHuella = z.object({
  huella: z.string().trim().regex(HUELLA_VALIDA, 'La huella tiene 64 caracteres hexadecimales'),
})

type ValoresHuella = z.infer<typeof esquemaHuella>

/**
 * Verificación de integridad (`/verificar-huella?huella=…`). La huella viaja en la URL para que la búsqueda sea compartible.
 * El frontal no recalcula nada: muestra el veredicto que devuelve el backend.
 */
export function VerificarHuella() {
  useTituloPagina('Verificar huella')
  const [params, setParams] = useSearchParams()
  const huellaUrl = (params.get('huella') ?? '').trim()
  // Solo se consulta una huella con formato correcto, siempre en minúsculas
  const huella = HUELLA_VALIDA.test(huellaUrl) ? huellaUrl.toLowerCase() : null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValoresHuella>({ resolver: zodResolver(esquemaHuella), defaultValues: { huella: huellaUrl } })

  const consulta = useQuery({
    queryKey: ['verificar-huella', huella],
    queryFn: () => verificarHuella(huella!),
    enabled: huella !== null,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  return (
    <section className={estilos.pagina}>
      <h1 className={estilos.titulo}>Verificar huella</h1>
      <p className={estilos.entrada}>
        Introduce la huella de un registro para comprobar que no se ha alterado desde que se generó.
      </p>

      <form
        className={formulario.formulario}
        noValidate
        onSubmit={handleSubmit((valores) => setParams({ huella: valores.huella.toLowerCase() }))}
      >
        <CampoTexto
          id="huella"
          etiqueta="Huella del registro"
          spellCheck={false}
          autoComplete="off"
          ayuda="64 caracteres hexadecimales (SHA-256). No distingue mayúsculas de minúsculas"
          error={errors.huella?.message}
          {...register('huella')}
        />
        <Boton type="submit" variante="principal">
          Verificar
        </Boton>
      </form>

      {huella !== null && <Resultado consulta={consulta} />}
    </section>
  )
}

function Resultado({ consulta }: { consulta: { data?: VerificacionHuella; error: unknown; isPending: boolean; refetch: () => unknown } }) {
  if (consulta.isPending) {
    return (
      <p className={estilos.entrada} aria-busy="true">
        Verificando la huella…
      </p>
    )
  }

  if (consulta.error) {
    const error = consulta.error
    if (error instanceof ErrorApi && error.detalle.tipo === 'no-encontrado') {
      return <p role="alert">No existe ningún registro con esa huella.</p>
    }
    return <MensajeError error={error} onReintentar={() => void consulta.refetch()} />
  }

  return consulta.data ? <Veredicto verificacion={consulta.data} /> : null
}

function Veredicto({ verificacion }: { verificacion: VerificacionHuella }) {
  const valida = verificacion.integridadValida

  return (
    <section className={formulario.resultado} aria-labelledby="titulo-resultado">
      <h2 id="titulo-resultado" className={estilos.subtitulo}>
        Resultado
      </h2>
      <p className={formulario.veredicto} data-validez={valida ? 'valida' : 'no-valida'} role={valida ? 'status' : 'alert'}>
        {valida
          ? 'Integridad válida: el registro no ha sido alterado.'
          : 'Integridad no válida: la huella recalculada no coincide con la guardada.'}
      </p>
      {verificacion.mensaje && <p>{verificacion.mensaje}</p>}

      <details className={formulario.detalle}>
        <summary>Detalle técnico</summary>
        <dl>
          <div>
            <dt>Huella</dt>
            <dd>
              <code className={formulario.codigo}>{verificacion.huella}</code>
            </dd>
          </div>
          <div>
            <dt>Huella anterior</dt>
            <dd>
              {verificacion.huellaAnterior ? (
                <code className={formulario.codigo}>{verificacion.huellaAnterior}</code>
              ) : (
                'Primer registro de la cadena'
              )}
            </dd>
          </div>
          <div>
            <dt>Fecha de generación</dt>
            <dd>{formatearFechaHora(verificacion.fechaGeneracion)}</dd>
          </div>
          <div>
            <dt>Cadena canónica</dt>
            <dd>
              <code className={formulario.codigo}>{verificacion.cadenaCanonica}</code>
            </dd>
          </div>
        </dl>
      </details>
    </section>
  )
}
