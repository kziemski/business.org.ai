/**
 * Fix Remaining Misplaced Industry Processes
 *
 * Scans processes/ (excluding industries/) for industry-specific files
 * that don't belong in cross-industry APQC folders.
 *
 * Detection criteria:
 * - File name/content contains industry-specific terms
 * - HierarchyId has segments > 50 (industry process numbering)
 *
 * Actions:
 * - If matching file exists in processes/industries/, delete the misplaced copy
 * - Otherwise, move to processes/industries/cross-industry/
 * - Clean up empty directories
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync, renameSync, copyFileSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const PROCESSES_DIR = join(ROOT, 'processes')
const INDUSTRIES_DIR = join(PROCESSES_DIR, 'industries')
const CROSS_INDUSTRY_DIR = join(INDUSTRIES_DIR, 'cross-industry')

// Industry-specific terms grouped by sector
const INDUSTRY_TERMS: Record<string, RegExp> = {
  aerospace: /\b(aircraft|fleet|defense|missile|satellite|avionics|airframe|propulsion|aerospace)\b/i,
  automotive: /\b(vehicle|dealership|automaker|automotive|powertrain)\b/i,
  healthcare: /\b(patient|clinical|hospital|pharmacy|physician|diagnosis|medical)\b/i,
  banking: /\b(loan|deposit|banking|mortgage|credit\s*union|lending)\b/i,
  retail: /\b(store|merchandise|shelf|storefront|retail\s*outlet)\b/i,
}

interface FileInfo {
  path: string
  name: string
  content: string
  hierarchyId: string
  id: string
  matchedIndustry: string | null
  reason: string
}

function hasHighHierarchyId(content: string): { high: boolean; id: string } {
  const match = content.match(/^hierarchyId:\s*"([^"]+)"/m)
  if (!match) return { high: false, id: '' }
  const id = match[1]
  const segments = id.split('.')
  const high = segments.some(s => parseInt(s, 10) > 50)
  return { high, id }
}

function detectIndustry(name: string, content: string): { industry: string | null; reason: string } {
  const text = name + ' ' + content
  for (const [industry, pattern] of Object.entries(INDUSTRY_TERMS)) {
    const match = text.match(pattern)
    if (match) {
      return { industry, reason: `term "${match[0]}"` }
    }
  }
  return { industry: null, reason: '' }
}

function walkFiles(dir: string): string[] {
  const results: string[] = []
  function walk(d: string) {
    let entries: string[]
    try { entries = readdirSync(d) } catch { return }
    for (const entry of entries) {
      const full = join(d, entry)
      let stat
      try { stat = statSync(full) } catch { continue }
      if (stat.isDirectory()) {
        if (entry === 'industries') continue
        walk(full)
      } else if (entry.endsWith('.mdx') && entry !== 'index.mdx' && entry !== '[Process].mdx') {
        results.push(full)
      }
    }
  }
  walk(dir)
  return results
}

function findInIndustries(id: string, name: string): boolean {
  // Recursively search industries/ for a file matching by id or filename
  function search(dir: string): boolean {
    let entries: string[]
    try { entries = readdirSync(dir) } catch { return false }
    for (const entry of entries) {
      const full = join(dir, entry)
      try {
        if (statSync(full).isDirectory()) {
          if (search(full)) return true
        } else if (entry.endsWith('.mdx')) {
          // Match by filename
          if (entry === name) return true
          // Match by id in frontmatter
          if (entry.replace('.mdx', '') === id) return true
          // Check id inside file
          try {
            const content = readFileSync(full, 'utf-8')
            const idMatch = content.match(/^id:\s*(\S+)/m)
            if (idMatch && idMatch[1] === id) return true
          } catch {}
        }
      } catch { continue }
    }
    return false
  }
  return search(INDUSTRIES_DIR)
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
  try { entries = readdirSync(dir) } catch { return }
  if (entries.length === 0 && dir !== PROCESSES_DIR) {
    rmdirSync(dir)
    console.log(`  Cleaned empty dir: ${dir.replace(ROOT + '/', '')}`)
    dirsCleaned++
  }
}

let dirsCleaned = 0

async function main() {
  console.log('=== Scanning for misplaced industry-specific files ===\n')

  const allFiles = walkFiles(PROCESSES_DIR)
  console.log(`Scanned ${allFiles.length} .mdx files in processes/ (excluding industries/)\n`)

  const misplaced: FileInfo[] = []

  for (const filePath of allFiles) {
    const name = basename(filePath)
    let content: string
    try { content = readFileSync(filePath, 'utf-8') } catch { continue }

    const { high, id: hierarchyId } = hasHighHierarchyId(content)
    const { industry, reason: termReason } = detectIndustry(name, content)
    const idMatch = content.match(/^id:\s*(\S+)/m)
    const id = idMatch ? idMatch[1] : name.replace('.mdx', '')

    if (high || industry) {
      const reasons: string[] = []
      if (high) reasons.push(`high hierarchyId "${hierarchyId}"`)
      if (industry) reasons.push(`${industry}: ${termReason}`)

      misplaced.push({
        path: filePath,
        name,
        content,
        hierarchyId,
        id,
        matchedIndustry: industry,
        reason: reasons.join('; '),
      })
    }
  }

  console.log(`Found ${misplaced.length} misplaced files\n`)

  let deleted = 0
  let moved = 0

  for (const file of misplaced) {
    const existsInIndustries = findInIndustries(file.id, file.name)

    if (!existsSync(file.path)) {
      console.log(`  SKIP (already removed): ${file.path.replace(ROOT + '/', '')}`)
      continue
    }

    if (existsInIndustries) {
      unlinkSync(file.path)
      deleted++
      console.log(`  DELETED: ${file.path.replace(ROOT + '/', '')} (${file.reason})`)
    } else {
      // Move to cross-industry
      mkdirSync(CROSS_INDUSTRY_DIR, { recursive: true })
      const dest = join(CROSS_INDUSTRY_DIR, file.name)
      let finalDest = dest
      if (existsSync(finalDest)) {
        finalDest = join(CROSS_INDUSTRY_DIR, file.id + '.mdx')
      }
      copyFileSync(file.path, finalDest)
      unlinkSync(file.path)
      moved++
      console.log(`  MOVED:   ${file.path.replace(ROOT + '/', '')} -> industries/cross-industry/${basename(finalDest)} (${file.reason})`)
    }
  }

  console.log('\n=== Cleaning empty directories ===\n')
  removeEmptyDirs(PROCESSES_DIR)

  console.log(`\n=== Summary ===`)
  console.log(`Files deleted (already in industries/): ${deleted}`)
  console.log(`Files moved to cross-industry/:         ${moved}`)
  console.log(`Empty directories cleaned:              ${dirsCleaned}`)
}

main().catch(console.error)
