#!/usr/bin/env node
// Falla si la compilación (dist/) contiene secretos o URLs de backend (spec publicacion-frontal: «Artefacto sin secretos»).
// Se ejecuta como `postbuild`, así que `npm run build` no termina bien si encuentra algo.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const dist = join(raiz, 'dist')

const prohibidos = [
  { nombre: 'cabecera de clave de API', patron: /x-api-key/i },
  { nombre: 'cabecera Authorization', patron: /\bauthorization\b/i },
  // React Router incluye 'http://localhost' sin puerto como base interna: se busca un backend local con puerto
  { nombre: 'backend local', patron: /localhost:\d{2,5}|127\.0\.0\.1/ },
  { nombre: 'URL absoluta de la API o del actuator', patron: /https?:\/\/[^\s"'`<>]+\/(?:api|actuator)(?:\/|\b)/i },
]

const ficheros = (directorio) =>
  readdirSync(directorio).flatMap((nombre) => {
    const ruta = join(directorio, nombre)
    return statSync(ruta).isDirectory() ? ficheros(ruta) : [ruta]
  })

const hallazgos = []
for (const fichero of ficheros(dist).filter((f) => /\.(html|js|css|json|txt|map|svg)$/.test(f))) {
  const contenido = readFileSync(fichero, 'utf8')
  for (const { nombre, patron } of prohibidos) {
    const coincidencia = patron.exec(contenido)
    if (coincidencia) {
      const contexto = contenido.slice(Math.max(0, coincidencia.index - 40), coincidencia.index + 60).replace(/\s+/g, ' ')
      hallazgos.push(`${relative(raiz, fichero)}: ${nombre} → …${contexto}…`)
    }
  }
}

if (hallazgos.length > 0) {
  console.error('dist/ contiene datos que no deben publicarse:\n' + hallazgos.map((h) => `  - ${h}`).join('\n'))
  process.exit(1)
}
console.log('dist/ sin secretos ni URLs de backend.')
