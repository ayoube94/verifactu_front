#!/usr/bin/env node
// Sincroniza los changes de OpenSpec con los issues de GitHub (milestone por fase, issue por tarea, issue padre por fase).
// Uso:
//   node scripts/openspec-issues.mjs crear <change> <N> "<descripción>"   crea milestone, tareas y padre de la fase N
//   node scripts/openspec-issues.mjs tarea <change> <X.Y>               cierra el issue de la tarea X.Y
//   node scripts/openspec-issues.mjs cerrar <change>                    cierra el padre y el milestone si todo está hecho
// Requiere la CLI `gh` autenticada. Es idempotente: `crear` no duplica si ya existe el padre del change.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const REPO = process.env.GH_REPO ?? 'ayoube94/verifactu_front'

const gh = (args, opciones = {}) => execFileSync('gh', args, { encoding: 'utf8', cwd: raiz, ...opciones }).trim()
const ghJson = (args) => JSON.parse(gh(args))

function leerTareas(change) {
  const candidatos = [join(raiz, 'openspec', 'changes', change, 'tasks.md'), ...ficherosArchivados(change)]
  const ruta = candidatos.find((c) => existsSync(c))
  if (!ruta) throw new Error(`No encuentro tasks.md de ${change}`)
  const tareas = []
  let grupo = ''
  let actual = null
  for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
    if (linea.startsWith('## ')) {
      grupo = linea.slice(3).trim()
      actual = null
      if (grupo.startsWith('Workflow')) grupo = ''
      continue
    }
    const m = /^- \[( |x)\] (\d+\.\d+) (.*)$/.exec(linea)
    if (m && grupo) {
      actual = { hecha: m[1] === 'x', numero: m[2], texto: m[3], detalle: [], grupo }
      tareas.push(actual)
      continue
    }
    if (actual && linea.startsWith('  ') && linea.trim() !== '') actual.detalle.push(linea.trim())
    else if (linea.trim() === '') continue
    else actual = null
  }
  return { tareas, ruta }
}

// Tras archivar, el change vive en openspec/changes/archive/<fecha>-<change>/
function ficherosArchivados(change) {
  const dir = join(raiz, 'openspec', 'changes', 'archive')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((d) => d.endsWith(`-${change}`))
    .map((d) => join(dir, d, 'tasks.md'))
}

// Todos los issues de tareas y padres del repo (abiertos y cerrados), una sola consulta por ejecución.
function issuesDelRepo() {
  return ghJson(['issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '500', '--json', 'number,title,body,state,labels,milestone'])
}

const esPadre = (issue, change) => issue.labels.some((l) => l.name === 'fase') && issue.body.includes(`Change de OpenSpec: \`${change}\``)
const esTarea = (issue, change) =>
  issue.labels.some((l) => l.name === 'tarea') && new RegExp(`(^|[/-])${change}/tasks\\.md`).test(issue.body)

function escribirTemporal(contenido) {
  const archivo = join(tmpdir(), `openspec-issues-${process.pid}-${Date.now()}.md`)
  writeFileSync(archivo, contenido)
  return archivo
}

function crearMilestone(titulo, descripcion) {
  const existente = ghJson(['api', `repos/${REPO}/milestones?state=all&per_page=100`]).find((m) => m.title === titulo)
  if (existente) return existente.title
  return JSON.parse(gh(['api', '-X', 'POST', `repos/${REPO}/milestones`, '-f', `title=${titulo}`, '-f', `description=${descripcion}`])).title
}

function crearIssue({ titulo, cuerpo, etiqueta, milestone }) {
  const archivo = escribirTemporal(cuerpo)
  try {
    const url = gh(['issue', 'create', '--repo', REPO, '--title', titulo, '--body-file', archivo, '--milestone', milestone, '--label', etiqueta])
    return Number(url.split('/').pop())
  } finally {
    unlinkSync(archivo)
  }
}

function cerrarIssue(numero) {
  gh(['issue', 'close', String(numero), '--repo', REPO, '--reason', 'completed'])
}

function comando_crear(change, fase, descripcion) {
  if (!fase || !descripcion) throw new Error('crear <change> <N> "<descripción>"')
  const issues = issuesDelRepo()
  if (issues.some((i) => esPadre(i, change))) {
    console.log(`Ya existe el padre de ${change}: no creo nada.`)
    return
  }
  const milestone = `Fase ${fase} · ${change}`
  crearMilestone(milestone, descripcion)
  const { tareas, ruta } = leerTareas(change)
  const relativa = ruta.replace(raiz + (raiz.endsWith('/') || raiz.endsWith('\\') ? '' : '/'), '').replace(/\\/g, '/')
  const numeros = []
  for (const t of tareas) {
    const cuerpo = [
      `**Tarea ${t.numero}** · grupo: ${t.grupo}`,
      '',
      t.texto,
      ...t.detalle.map((d) => `> ${d}`),
      '',
      `Fuente: \`${relativa}\``,
    ].join('\n')
    const n = crearIssue({
      titulo: `[Fase ${fase}] ${t.numero} ${t.texto}`.slice(0, 250),
      cuerpo,
      etiqueta: 'tarea',
      milestone,
    })
    if (t.hecha) cerrarIssue(n)
    numeros.push({ n, hecha: t.hecha })
  }
  const lista = numeros.length
    ? numeros.map((t) => `- [${t.hecha ? 'x' : ' '}] #${t.n}`).join('\n')
    : '_Sin tareas._'
  const padre = crearIssue({
    titulo: `Fase ${fase} · ${change}`,
    cuerpo: [descripcion, '', `Change de OpenSpec: \`${change}\``, '', '## Tareas', lista].join('\n'),
    etiqueta: 'fase',
    milestone,
  })
  console.log(`Creados: padre #${padre} y ${numeros.length} tareas en "${milestone}".`)
}

function comando_tarea(change, numero) {
  if (!numero) throw new Error('tarea <change> <X.Y>')
  const issues = issuesDelRepo()
  const tarea = issues.find(
    (i) => esTarea(i, change) && i.title.includes(` ${numero} `) && i.state === 'OPEN',
  )
  if (!tarea) {
    console.log(`No hay issue abierto para la tarea ${numero} de ${change} (¿ya cerrado o no creado?).`)
    return
  }
  cerrarIssue(tarea.number)
  console.log(`Cerrado #${tarea.number} (tarea ${numero}).`)
}

function comando_cerrar(change) {
  const issues = issuesDelRepo()
  const tareas = issues.filter((i) => esTarea(i, change))
  const abiertas = tareas.filter((i) => i.state === 'OPEN')
  if (abiertas.length > 0) {
    console.log(`Quedan ${abiertas.length} tareas abiertas en ${change}: no cierro el padre.`)
    return
  }
  const padre = issues.find((i) => esPadre(i, change))
  if (!padre) {
    console.log(`No existe el padre de ${change}.`)
    return
  }
  if (padre.state !== 'OPEN') {
    console.log(`El padre #${padre.number} de ${change} ya estaba cerrado.`)
    return
  }
  cerrarIssue(padre.number)
  console.log(`Cerrado el padre #${padre.number} de ${change} (${tareas.length} tareas hechas).`)
}

const [, , comando, change, arg1, arg2] = process.argv
const comandos = { crear: () => comando_crear(change, arg1, arg2), tarea: () => comando_tarea(change, arg1), cerrar: () => comando_cerrar(change) }
if (!comandos[comando] || !change) {
  console.error('Uso: openspec-issues.mjs crear|tarea|cerrar <change> [...]')
  process.exit(1)
}
comandos[comando]()
