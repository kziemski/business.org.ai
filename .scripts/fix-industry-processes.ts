/**
 * Fix Industry Processes
 *
 * 1. Remove misplaced industry-specific process files from APQC folders
 *    (files with hierarchyId segments > 50 are industry processes dumped in wrong location)
 * 2. Generate proper industry process files from .data/IndustryProcesses.tsv
 *    into processes/industries/{industry-name}/
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const PROCESSES_DIR = join(ROOT, 'processes')
const DATA_DIR = join(ROOT, '.data')
const INDUSTRIES_DIR = join(PROCESSES_DIR, 'industries')

// ── PHASE 1: Remove misplaced files ──

function hasHighHierarchyId(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const match = content.match(/^hierarchyId:\s*"([^"]+)"/m)
    if (!match) return false
    const segments = match[1].split('.')
    return segments.some(s => parseInt(s, 10) > 50)
  } catch {
    return false
  }
}

function findMisplacedFiles(dir: string): string[] {
  const results: string[] = []

  function walk(d: string) {
    let entries: string[]
    try { entries = readdirSync(d) } catch { return }

    for (const entry of entries) {
      const full = join(d, entry)
      let stat
      try { stat = statSync(full) } catch { continue }

      if (stat.isDirectory()) {
        if (entry === 'industries') continue // skip industries folder
        walk(full)
      } else if (entry.endsWith('.mdx') && entry !== 'index.mdx' && entry !== '[Process].mdx') {
        if (hasHighHierarchyId(full)) {
          results.push(full)
        }
      }
    }
  }

  walk(dir)
  return results
}

function removeEmptyDirs(dir: string) {
  let entries: string[]
  try { entries = readdirSync(dir) } catch { return }

  for (const entry of entries) {
    const full = join(dir, entry)
    try {
      if (statSync(full).isDirectory()) {
        if (entry === 'industries') continue
        removeEmptyDirs(full)
      }
    } catch { continue }
  }

  // Re-read after cleaning children
  try { entries = readdirSync(dir) } catch { return }
  if (entries.length === 0 && dir !== PROCESSES_DIR) {
    rmdirSync(dir)
    console.log(`  Removed empty dir: ${dir.replace(ROOT + '/', '')}`)
  }
}

// ── PHASE 2: Generate industry process files ──

interface IndustryProcess {
  ns: string
  type: string
  id: string
  name: string
  description: string
  code: string
  pcfId: string
  industry: string
  subject: string
  statement: string
  canonicalProcessId: string
}

function parseIndustryProcesses(): IndustryProcess[] {
  const tsvPath = join(DATA_DIR, 'IndustryProcesses.tsv')
  if (!existsSync(tsvPath)) {
    console.error('IndustryProcesses.tsv not found')
    return []
  }
  const lines = readFileSync(tsvPath, 'utf-8').split('\n')
  const headers = lines[0].split('\t')
  const records: IndustryProcess[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (cols.length < headers.length) continue
    const rec: any = {}
    headers.forEach((h, idx) => rec[h.trim()] = cols[idx]?.trim() || '')
    records.push(rec as IndustryProcess)
  }

  return records
}

function slugToTitle(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function generateIndustryIndex(industry: string, processes: IndustryProcess[]): string {
  const title = slugToTitle(industry)
  const categories = new Map<string, IndustryProcess[]>()
  for (const p of processes) {
    const cat = p.code.split('.')[0] || 'other'
    if (!categories.has(cat)) categories.set(cat, [])
    categories.get(cat)!.push(p)
  }

  let content = `---
id: ${industry}
name: "${title}"
type: Industry
status: complete
---

# ${title} Industry Processes

This industry contains ${processes.length} processes mapped from the APQC Process Classification Framework.

## Process Categories

| Category | Count |
|----------|-------|
`

  const sorted = [...categories.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
  for (const [cat, procs] of sorted) {
    content += `| ${cat}.0 | ${procs.length} |\n`
  }

  content += `\n## Subjects\n\n`
  const subjects = [...new Set(processes.map(p => p.subject))].sort()
  for (const s of subjects) {
    content += `- ${s}\n`
  }

  return content
}

function generateProcessFile(proc: IndustryProcess): string {
  return `---
id: ${proc.id}
name: "${proc.name}"
code: "${proc.code}"
industry: "${proc.industry}"
type: IndustryProcess
status: complete
canonicalProcessId: "${proc.canonicalProcessId}"
pcfId: "${proc.pcfId}"
subject: "${proc.subject}"
---

# ${proc.name}

## Overview

${proc.description || proc.name}

## Industry Context

- **Industry**: ${slugToTitle(proc.industry)}
- **Subject**: ${proc.subject}
- **APQC Code**: ${proc.code}
- **PCF ID**: ${proc.pcfId}

## Canonical Process

This is an industry-specific implementation of [${proc.canonicalProcessId}](/processes/${proc.canonicalProcessId}).

## GraphDL Statement

\`\`\`
${proc.statement}
\`\`\`
`
}

// ── Main ──

async function main() {
  console.log('=== Phase 1: Remove misplaced industry files from APQC folders ===\n')

  const misplaced = findMisplacedFiles(PROCESSES_DIR)
  console.log(`Found ${misplaced.length} misplaced files to remove\n`)

  for (const f of misplaced) {
    unlinkSync(f)
  }
  console.log(`Deleted ${misplaced.length} misplaced files\n`)

  // Clean up empty directories
  console.log('Cleaning empty directories...')
  removeEmptyDirs(PROCESSES_DIR)
  console.log()

  console.log('=== Phase 2: Generate industry process files ===\n')

  const processes = parseIndustryProcesses()
  console.log(`Parsed ${processes.length} industry processes from TSV\n`)

  // Group by industry
  const byIndustry = new Map<string, IndustryProcess[]>()
  for (const p of processes) {
    if (!p.industry) continue
    if (!byIndustry.has(p.industry)) byIndustry.set(p.industry, [])
    byIndustry.get(p.industry)!.push(p)
  }

  console.log(`Found ${byIndustry.size} industries\n`)

  // Ensure industries directory
  mkdirSync(INDUSTRIES_DIR, { recursive: true })

  let createdCount = 0
  let skippedCount = 0

  for (const [industry, procs] of [...byIndustry.entries()].sort()) {
    const industryDir = join(INDUSTRIES_DIR, industry)
    mkdirSync(industryDir, { recursive: true })

    // Index file
    const indexPath = join(industryDir, 'index.mdx')
    if (!existsSync(indexPath)) {
      writeFileSync(indexPath, generateIndustryIndex(industry, procs))
      createdCount++
    } else {
      skippedCount++
    }

    // Individual process files
    for (const proc of procs) {
      // Use a safe filename from the id
      const filename = proc.id.replace(/[^a-zA-Z0-9_-]/g, '_') + '.mdx'
      const filePath = join(industryDir, filename)

      if (!existsSync(filePath)) {
        writeFileSync(filePath, generateProcessFile(proc))
        createdCount++
      } else {
        skippedCount++
      }
    }

    console.log(`  ${industry}: ${procs.length} processes`)
  }

  console.log(`\n=== Summary ===`)
  console.log(`Deleted: ${misplaced.length} misplaced files`)
  console.log(`Created: ${createdCount} new files`)
  console.log(`Skipped: ${skippedCount} existing files`)
  console.log(`Industries: ${byIndustry.size}`)
}

main().catch(console.error)
