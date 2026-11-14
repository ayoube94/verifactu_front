#!/usr/bin/env node
// Genera src/api/schema.d.ts a partir de contrato/openapi.json.
//   node scripts/api-types.mjs          → escribe schema.d.ts  (npm run api:types)
//   node scripts/api-types.mjs --check  → falla si schema.d.ts no corresponde al contrato (npm run api:check)
// El generador vive en tools/openapi (TypeScript 5, aislado del TypeScript 7 del proyecto).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const contrato = join(raiz, 'contrato', 'openapi.json')
const esquema = join(raiz, 'src', 'api', 'schema.d.ts')
const cli = join(raiz, 'tools', 'openapi', 'node_modules', 'openapi-typescript', 'bin', 'cli.js')

if (!existsSync(cli)) {
  console.error('Falta el generador. Instálalo con: npm run api:tools')
  process.exit(1)
}

const generar = (salida) => execFileSync(process.execPath, [cli, contrato, '--output', salida], { stdio: 'inherit' })
// Normaliza finales de línea para que la comparación no dependa del sistema operativo
const leer = (ruta) => readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')

if (!process.argv.includes('--check')) {
  generar(esquema)
  process.exit(0)
}

const temporal = mkdtempSync(join(tmpdir(), 'schema-'))
try {
  const regenerado = join(temporal, 'schema.d.ts')
  generar(regenerado)
  if (!existsSync(esquema) || leer(esquema) !== leer(regenerado)) {
    console.error('src/api/schema.d.ts no corresponde a contrato/openapi.json. Ejecuta: npm run api:types')
    process.exit(1)
  }
  console.log('Los tipos de la API corresponden al contrato.')
} finally {
  rmSync(temporal, { recursive: true, force: true })
}
