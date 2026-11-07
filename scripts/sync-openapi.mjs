#!/usr/bin/env node
// Actualiza contrato/openapi.json con el artefacto `openapi` del último build correcto de `main` del backend.
// Requiere la CLI `gh` autenticada con acceso al repositorio del backend (es privado).
// Uso: npm run api:sync   (repo alternativo: BACKEND_REPO=owner/repo npm run api:sync)
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const repo = process.env.BACKEND_REPO ?? 'ayoube94/verifactu_web'
const destino = new URL('../contrato/openapi.json', import.meta.url)

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim()

const runId = gh(
  'run', 'list', '--repo', repo, '--branch', 'main', '--workflow', 'CI', '--status', 'success',
  '--limit', '1', '--json', 'databaseId', '--jq', '.[0].databaseId',
)
if (!runId) {
  console.error(`No hay ningún build correcto de main en ${repo}.`)
  process.exit(1)
}

const temporal = mkdtempSync(join(tmpdir(), 'openapi-'))
try {
  gh('run', 'download', runId, '--repo', repo, '--name', 'openapi', '--dir', temporal)
  const contrato = JSON.parse(readFileSync(join(temporal, 'openapi.json'), 'utf8'))
  // Formato estable para que los diffs del PR sean legibles
  writeFileSync(destino, `${JSON.stringify(contrato, null, 2)}\n`)
  console.log(`contrato/openapi.json actualizado desde ${repo}, build ${runId}.`)
} finally {
  rmSync(temporal, { recursive: true, force: true })
}
