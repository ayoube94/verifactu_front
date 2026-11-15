import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { useTituloPagina } from '../../app/useTituloPagina.ts'
import { Boton } from '../../componentes/Boton.tsx'
import { CampoTexto } from '../../componentes/Campos.tsx'
import estilos from '../Pagina.module.css'
import formulario from './ConsultarFactura.module.css'

const esquemaConsulta = z.object({
  id: z
    .string()
    .trim()
    .regex(/^\d+$/, 'El id debe ser un número entero positivo')
    .refine((valor) => Number(valor) > 0, 'El id debe ser un número entero positivo')
    .refine((valor) => Number.isSafeInteger(Number(valor)), 'El id debe ser un número entero positivo'),
})

type ValoresConsulta = z.infer<typeof esquemaConsulta>

/** Consulta de una factura por su id (`/consultar`): valida el id y navega a `/facturas/:id`. */
export function ConsultarFactura() {
  useTituloPagina('Consultar factura')
  const navegar = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValoresConsulta>({ resolver: zodResolver(esquemaConsulta), defaultValues: { id: '' } })

  return (
    <section className={estilos.pagina}>
      <h1 className={estilos.titulo}>Consultar factura</h1>
      <p className={estilos.entrada}>Introduce el id con el que se registró la factura para ver sus datos y su estado ante la AEAT.</p>

      <form
        className={formulario.formulario}
        noValidate
        onSubmit={handleSubmit((valores) => navegar(`/facturas/${Number(valores.id)}`))}
      >
        <CampoTexto
          id="id-factura"
          etiqueta="Id de la factura"
          inputMode="numeric"
          autoComplete="off"
          ayuda="Número entero que asigna el sistema al emitirla"
          error={errors.id?.message}
          {...register('id')}
        />
        <Boton type="submit" variante="principal">
          Consultar
        </Boton>
      </form>
    </section>
  )
}
